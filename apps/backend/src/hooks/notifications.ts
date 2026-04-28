import * as q from "@softeng-app/db";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Determines the expiration threshold category based on the remaining time until expiry.
 * Used to categorize how close a piece of content is to its expiration date.
 *
 * @param msUntilExpiry The number of milliseconds remaining until the content expires.
 * @returns "expired" if already past the expiration date, "1h" if within one hour,
 *          "3d" if within three days, or null if it's further out.
 */
function pickThreshold(msUntilExpiry: number): "3d" | "1h" | "expired" | null {
    if (msUntilExpiry <= 0) return "expired";
    if (msUntilExpiry <= ONE_HOUR_MS) return "1h";
    if (msUntilExpiry <= THREE_DAYS_MS) return "3d";
    return null;
}

/**
 * Retrieves the unified notification feed for the currently authenticated employee.
 * This includes both persisted notifications (e.g., changes or ownership transfers)
 * and dynamic expiration alerts (e.g., content expiring in 3 days, 1 hour, or already expired).
 * Notifications and expirations that the user has previously dismissed are filtered out.
 *
 * @param req The Express request object, containing the authenticated user's Auth0 ID in `req.auth`.
 * @param res The Express response object used to send the resulting feed or error status.
 * @returns A JSON array of notification objects sorted by creation date (newest first).
 */
export const getNotifications = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
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
export const getDismissedNotifications = async (req: req, res: res) => {
    const auth0Id = req.auth?.payload.sub;

    try {
        if (!auth0Id) return res.status(401).end();

        const employee = await q.Employee.queryEmployeeByAuth(auth0Id);
        if (!employee) return res.status(404).json({ error: "No employee found" });

        const dismissedNotifs = await q.Notification.queryDismissedNotifications(employee.id);

        const feed: Array<{
            id: string;
            type: "change" | "ownership" | "expiration";
            contentId: number;
            contentName: string;
            triggeredBy: { id: number; firstName: string; lastName: string } | null;
            createdAt: string;
            dismissedAt: string;
            metadata: unknown;
        }> = [];

        for (const d of dismissedNotifs) {
            feed.push({
                id: String(d.notification.id),
                type: d.notification.type,
                contentId: d.notification.contentId,
                contentName: d.notification.content.displayName,
                triggeredBy: d.notification.triggeredBy,
                createdAt: d.notification.createdAt.toISOString(),
                dismissedAt: d.dismissedAt.toISOString(),
                metadata: d.notification.metadata ?? {},
            });
        }


        feed.sort((a, b) => (a.dismissedAt < b.dismissedAt ? 1 : -1));
        return res.status(200).json(feed);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/**
 * Dismisses a specific notification or expiration alert for the currently authenticated employee.
 * Once dismissed, the notification or alert will no longer appear in the user's feed.
 *
 * @param req The Express request object, containing the notification payload in `req.body`
 *            (requires `kind`, and either `notificationId` or `contentId` and `threshold`).
 * @param res The Express response object used to return a 204 No Content on success or an error status.
 */
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