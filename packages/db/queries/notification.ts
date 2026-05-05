import * as p from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Handles database operations related to notifications and expiration alerts.
 */
export class Notification {
    /**
     * Creates a new notification indicating that content has changed.
     * Only emits a notification if there is at least one field changed.
     *
     * @param contentId The ID of the content that was modified.
     * @param triggeredById The ID of the employee who made the change (or null if automated).
     * @param targetPersona The persona that should receive this notification.
     * @param changedFields A list of strings representing the fields that were modified.
     * @returns The created notification object, or null if no fields were changed.
     */
    public static async emitChange(
        contentId: number,
        triggeredById: number | null,
        targetPersona: p.Persona,
        changedFields: Array<"displayName" | "linkURL" | "fileURI" | "contentType" | "status" | "expiration" | "targetPersona" | "tags">,
    ) {
        if (changedFields.length === 0) return null;
        return prisma.notification.create({
            data: {
                type: "change",
                contentId: contentId,
                triggeredById: triggeredById,
                targetPersona: targetPersona,
                metadata: { changedFields },
            },
        });
    }

    /**
     * Creates a new notification indicating a change in content ownership.
     *
     * @param contentId The ID of the content whose ownership changed.
     * @param triggeredById The ID of the employee who initiated the transfer (or null if automated).
     * @param targetPersona The persona that should receive this notification.
     * @param oldOwnerId The ID of the previous owner (or null if there was no previous owner).
     * @param newOwnerId The ID of the new owner (or null if ownership was removed).
     * @param newOwnerName The full name of the new owner for display purposes.
     * @returns The created notification object.
     */
    public static async emitOwnership(
        contentId: number,
        triggeredById: number | null,
        targetPersona: p.Persona,
        oldOwnerId: number | null,
        newOwnerId: number | null,
        newOwnerName: string | null,
    ) {
        return prisma.notification.create({
            data: {
                type: "ownership",
                contentId: contentId,
                triggeredById: triggeredById,
                targetPersona: targetPersona,
                metadata: { oldOwnerId, newOwnerId, newOwnerName },
            },
        });
    }

    /**
     * Retrieves recent persisted notifications targeted at a specific persona.
     * If the persona is 'admin', it fetches notifications across all personas.
     *
     * @param persona The target persona to filter notifications by.
     * @param limit The maximum number of notifications to return (defaults to 100).
     * @returns A list of notification objects, ordered by creation date descending.
     */
    public static async queryByPersona(persona: p.Persona, limit = 100) {
        const where = persona === "admin" ? {} : { targetPersona: persona };
        return prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                content: { select: { id: true, displayName: true, expiration: true } },
                triggeredBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    /**
     * Retrieves content that has an expiration date within a specified number of days.
     * If the persona is 'admin', it fetches expiring content across all personas.
     *
     * @param persona The target persona to filter expiring content by.
     * @param windowDays The number of days ahead to look for expiring content (defaults to 7).
     * @returns A list of expiring content objects, ordered by expiration date ascending.
     */
    public static async queryExpiringContent(persona: p.Persona, windowDays = 7) {
        const horizon = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);
        const where: p.Prisma.ContentWhereInput = {
            expiration: { not: null, lte: horizon },
            ...(persona === "admin" ? {} : { targetPersona: persona }),
        };
        return prisma.content.findMany({
            where,
            select: { id: true, displayName: true, expiration: true },
            orderBy: { expiration: "asc" },
        });
    }

    /**
     * Retrieves a set of notification IDs that the specified employee has dismissed.
     *
     * @param employeeId The ID of the employee.
     * @returns A Set containing the IDs of dismissed notifications.
     */
    public static async getDismissedNotificationIds(employeeId: number): Promise<Set<number>> {
        const rows = await prisma.notificationDismissal.findMany({
            where: { employeeId },
            select: { notificationId: true },
        });
        return new Set(rows.map((r) => r.notificationId));
    }

    /**
     * Retrieves a set of expiration alerts that the specified employee has dismissed.
     * The alerts are represented as a string combining the content ID and threshold (e.g., "123:3d").
     *
     * @param employeeId The ID of the employee.
     * @returns A Set containing compound strings of dismissed expiration alerts.
     */
    public static async getDismissedExpirations(employeeId: number): Promise<Set<string>> {
        const rows = await prisma.expirationDismissal.findMany({
            where: { employeeId },
            select: { contentId: true, threshold: true },
        });
        return new Set(rows.map((r) => `${r.contentId}:${r.threshold}`));
    }

    /**
     * Records a notification as dismissed by an employee, so it no longer appears in their feed.
     * Uses upsert to gracefully handle cases where it was already dismissed.
     *
     * @param notificationId The ID of the notification to dismiss.
     * @param employeeId The ID of the employee dismissing the notification.
     * @returns The upserted dismissal record.
     */
    public static async dismissNotification(notificationId: number, employeeId: number) {
        return prisma.notificationDismissal.upsert({
            where: { notificationId_employeeId: { notificationId, employeeId } },
            update: {},
            create: { notificationId, employeeId },
        });
    }

    /**
     * Records an expiration alert as dismissed by an employee.
     * Since an item can expire in stages (e.g., 3 days, 1 hour), the dismissal is tied to a specific threshold.
     *
     * @param contentId The ID of the expiring content.
     * @param employeeId The ID of the employee dismissing the alert.
     * @param threshold The threshold category being dismissed (e.g., "3d", "1h", "expired").
     * @returns The upserted dismissal record.
     */
    public static async dismissExpiration(contentId: number, employeeId: number, threshold: string) {
        return prisma.expirationDismissal.upsert({
            where: { contentId_employeeId_threshold: { contentId, employeeId, threshold } },
            update: {},
            create: { contentId, employeeId, threshold },
        });
    }
    /**
     * Retrieves all notifications that the specified employee has previously dismissed,
     * including the full notification and its associated content and triggering employee.
     *
     * @param employeeId The ID of the employee.
     * @returns A list of dismissal records ordered by dismissal date descending.
     */
    public static async queryDismissedNotifications(employeeId: number) {
        return prisma.notificationDismissal.findMany({
            where: { employeeId },
            orderBy: { dismissedAt: "desc" },
            include: {
                notification: {
                    include: {
                        content: { select: { id: true, displayName: true, expiration: true } },
                        triggeredBy: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
    }

    /**
     * Retrieves all expiration alerts that the specified employee has previously dismissed,
     * including the associated content details.
     *
     * @param employeeId The ID of the employee.
     * @returns A list of expiration dismissal records ordered by dismissal date descending.
     */
    public static async queryDismissedExpirations(employeeId: number) {
        return prisma.expirationDismissal.findMany({
            where: { employeeId },
            orderBy: { dismissedAt: "desc" },
            include: {
                content: { select: { id: true, displayName: true, expiration: true } },
            },
        });
    }

}