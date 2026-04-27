import * as q from "@softeng-app/db";
import { req, res } from "./types";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function pickThreshold(msUntilExpiry: number): "3d" | "1h" | "expired" | null {
    if (msUntilExpiry <= 0) return "expired";
    if (msUntilExpiry <= ONE_HOUR_MS) return "1h";
    if (msUntilExpiry <= THREE_DAYS_MS) return "3d";
    return null;
}

export const getNotifications = async (req: req, res: res) => {
    const auth0Id = req.auth?.payload.sub;

    try {
        if (!auth0Id) return res.status(401).end();

        const employee = await q.Employee.queryEmployeeByAuth(auth0Id);
        if (!employee) return res.status(404).json({ error: "No employee found" });

        const [persisted, expiring, dismissedNotifs, dismissedExpirations] = await Promise.all([
            q.Notification.queryByPersona(employee.persona),
            q.Notification.queryExpiringContent(employee.persona),
            q.Notification.getDismissedNotificationIds(employee.id),
            q.Notification.getDismissedExpirations(employee.id),
        ]);

        const feed: Array<{
            id: string;
            type: "change" | "ownership" | "expiration";
            contentId: number;
            contentName: string;
            triggeredBy: { id: number; firstName: string; lastName: string } | null;
            createdAt: string;
            metadata: unknown;
        }> = [];

        for (const n of persisted) {
            if (dismissedNotifs.has(n.id)) continue;
            feed.push({
                id: String(n.id),
                type: n.type,
                contentId: n.contentId,
                contentName: n.content.displayName,
                triggeredBy: n.triggeredBy,
                createdAt: n.createdAt.toISOString(),
                metadata: n.metadata ?? {},
            });
        }

        const now = Date.now();
        for (const c of expiring) {
            if (!c.expiration) continue;
            const msUntilExpiry = c.expiration.getTime() - now;
            const threshold = pickThreshold(msUntilExpiry);
            if (!threshold) continue;
            if (dismissedExpirations.has(`${c.id}:${threshold}`)) continue;
            let crossedAt: Date;
            if (threshold === "3d") {
                crossedAt = new Date(c.expiration.getTime() - THREE_DAYS_MS);
            } else if (threshold === "1h") {
                crossedAt = new Date(c.expiration.getTime() - ONE_HOUR_MS);
            } else {
                crossedAt = c.expiration;
            }

            feed.push({
                id: `exp-${c.id}-${threshold}`,
                type: "expiration",
                contentId: c.id,
                contentName: c.displayName,
                triggeredBy: null,
                createdAt: crossedAt.toISOString(),
                metadata: {
                    threshold,
                    expired: threshold === "expired",
                    daysLeft: Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24)),
                    hoursLeft: Math.ceil(msUntilExpiry / (1000 * 60 * 60)),
                },
            });
        }

        feed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return res.status(200).json(feed);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const dismissNotification = async (req: req, res: res) => {
    const auth0Id = req.auth?.payload.sub;

    try {
        if (!auth0Id) return res.status(401).end();

        const employee = await q.Employee.queryEmployeeByAuth(auth0Id);
        if (!employee) return res.status(404).json({ error: "No employee found" });

        const { kind, notificationId, contentId, threshold } = req.body ?? {};

        if (kind === "notification") {
            const id = parseInt(notificationId, 10);
            if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid notificationId" });
            await q.Notification.dismissNotification(id, employee.id);
            return res.status(204).end();
        }

        if (kind === "expiration") {
            const cid = parseInt(contentId, 10);
            if (!Number.isFinite(cid)) return res.status(400).json({ error: "invalid contentId" });
            if (typeof threshold !== "string") return res.status(400).json({ error: "invalid threshold" });
            await q.Notification.dismissExpiration(cid, employee.id, threshold);
            return res.status(204).end();
        }

        return res.status(400).json({ error: "invalid kind" });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};