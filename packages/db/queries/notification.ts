import * as p from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export class Notification {
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
    public static async getDismissedNotificationIds(employeeId: number): Promise<Set<number>> {
        const rows = await prisma.notificationDismissal.findMany({
            where: { employeeId },
            select: { notificationId: true },
        });
        return new Set(rows.map((r) => r.notificationId));
    }

    public static async getDismissedExpirations(employeeId: number): Promise<Set<string>> {
        const rows = await prisma.expirationDismissal.findMany({
            where: { employeeId },
            select: { contentId: true, threshold: true },
        });
        return new Set(rows.map((r) => `${r.contentId}:${r.threshold}`));
    }

    public static async dismissNotification(notificationId: number, employeeId: number) {
        return prisma.notificationDismissal.upsert({
            where: { notificationId_employeeId: { notificationId, employeeId } },
            update: {},
            create: { notificationId, employeeId },
        });
    }

    public static async dismissExpiration(contentId: number, employeeId: number, threshold: string) {
        return prisma.expirationDismissal.upsert({
            where: { contentId_employeeId_threshold: { contentId, employeeId, threshold } },
            update: {},
            create: { contentId, employeeId, threshold },
        });
    }
}