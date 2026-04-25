import * as q from "@softeng-app/db";
import { req, res } from "./types";

export const getNotifications = async (req: req, res: res) => {
    const auth0Id = req.auth?.payload.sub;

    try {
        if (!auth0Id) return res.status(401).end();

        const employee = await q.Employee.queryEmployeeByAuth(auth0Id);
        if (!employee) return res.status(404).json({ error: "No employee found" });

        const [persisted, expiring] = await Promise.all([
            q.Notification.queryByPersona(employee.persona),
            q.Notification.queryExpiringContent(employee.persona),
        ]);

        const feed: Array<{
            id: string;
            type: "change" | "ownership" | "expiration";
            contentId: number;
            contentName: string;
            triggeredBy: { id: number; firstName: string; lastName: string } | null;
            createdAt: string;
            metadata: unknown;
        }> = persisted.map((n) => ({
            id: String(n.id),
            type: n.type,
            contentId: n.contentId,
            contentName: n.content.displayName,
            triggeredBy: n.triggeredBy,
            createdAt: n.createdAt.toISOString(),
            metadata: n.metadata ?? {},
        }));

        const now = Date.now();
        for (const c of expiring) {
            if (!c.expiration) continue;
            const daysLeft = Math.ceil((c.expiration.getTime() - now) / (1000 * 60 * 60 * 24));
            feed.push({
                id: `exp-${c.id}`,
                type: "expiration",
                contentId: c.id,
                contentName: c.displayName,
                triggeredBy: null,
                createdAt: c.expiration.toISOString(),
                metadata: { daysLeft, expired: daysLeft <= 0 },
            });
        }

        feed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return res.status(200).json(feed);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};