import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect, contentSelect, srInclude} from "./helper";
import { Notification } from "./notification";
import { embeddingToSql } from '../lib/embeddings';


/**
 * Query class for the `Content` table.
 *
 * All read queries filter `deleted = false` by default. Deleted items are only
 * visible via `queryDeletedContent` / `queryDeletedContentById`. Raw SQL is used
 * in a few places because Prisma's ORM layer doesn't support the `vector` type
 * or full-text search ranking (`ts_rank`).
 */
export class Content {
    public static async semanticSearch(queryVector: number[], limit = 20): Promise<p.Content[]> {
        const embeddingStr = embeddingToSql(queryVector);

        return prisma.$queryRaw<p.Content[]>`
        SELECT
            id,
            "displayName",
            "linkURL",
            "fileURI",
            "contentType",
            "status",
            "targetPersona",
            "tags",
            "lastModified",
            "expiration",
            "textContent",
            "ownerId",
            "checkedOutById",
            "checkedOutAt",
            1 - ("embedding" <=> ${embeddingStr}::vector) AS similarity
        FROM "Content"
        WHERE "embedding" IS NOT NULL AND "deleted" = false
        ORDER BY "embedding" <=> ${embeddingStr}::vector
        LIMIT ${limit};
    `;
    }

    /** Updates textContent and embedding vector together after background extraction. */
    public static async updateTextAndEmbedding(id: number, textContent: string | null, embedding: number[]): Promise<void> {
        await prisma.$executeRaw`
            UPDATE "Content"
            SET "textContent" = ${textContent},
                "embedding" = ${embeddingToSql(embedding)}::vector
            WHERE id = ${id}
        `;
    }

    /**
     * Updates a content item's metadata and emits change/ownership notifications.
     * The caller must hold the checkout lock (`_checkedOutById` must match the current lock holder).
     * Notification emission is best-effort — a failure to emit does not roll back the update.
     */
    public static async updateContent(
        id: number,
        _name: string,
        _linkURL: string | null,
        _fileURI: string | null,
        _ownerId: number | null,
        _contentType: p.ContentType,
        _status: p.Status | null,
        _lastModified: Date, //TODO remove (unused, automatically uses current date)
        _expiration: Date | null,
        _targetPersona: string,
        _tags: string[],
        _checkedOutById: number | null,
    ): Promise<p.Content> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_targetPersona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const _statusTyped: p.Status = Helper.statusHelper(_status)
        const content = await prisma.content.findUnique({
            where: { id: id },
        })

        if (!content) {
            throw new Error("Content not found")
        }

        if (content.checkedOutById !== _checkedOutById) {
            throw new Error("You do not have this content checked out.")
        }

        const updated = await prisma.content.update({
            where: { id: id },
            data: {
                displayName: _name,
                linkURL: _linkURL,
                fileURI: _fileURI,
                ownerId: _ownerId,
                contentType: _contentType,
                status: _statusTyped,
                lastModified: new Date(),
                expiration: _expiration,
                targetPersona: _personaTyped,
                tags: _tags,
            }
        });

        try {
            const changedFields: Array<"displayName" | "linkURL" | "fileURI" | "contentType" | "status" | "expiration" | "targetPersona" | "tags"> = [];

            if (content.displayName !== _name) changedFields.push("displayName");
            if (content.linkURL !== _linkURL) changedFields.push("linkURL");
            if (content.fileURI !== _fileURI) changedFields.push("fileURI");
            if (content.contentType !== _contentType) changedFields.push("contentType");
            if (content.status !== _statusTyped) changedFields.push("status");
            if ((content.expiration?.getTime() ?? null) !== (_expiration?.getTime() ?? null)) {
                changedFields.push("expiration");
            }
            if (content.targetPersona !== _personaTyped) changedFields.push("targetPersona");
            if (JSON.stringify(content.tags) !== JSON.stringify(_tags)) changedFields.push("tags");

            if (changedFields.length > 0) {
                await Notification.emitChange(id, _checkedOutById, _personaTyped, changedFields);
            }

            if (content.ownerId !== _ownerId) {
                const newOwner = _ownerId
                    ? await prisma.employee.findUnique({
                        where: { id: _ownerId },
                        select: { firstName: true, lastName: true },
                    })
                    : null;
                const newOwnerName = newOwner ? `${newOwner.firstName} ${newOwner.lastName}` : null;
                await Notification.emitOwnership(id, _checkedOutById, _personaTyped, content.ownerId, _ownerId, newOwnerName);
            }
        } catch (err) {
            console.error("Failed to emit notification:", err);
        }

        return updated;
    }

    /**
     * Inserts a new content item via raw SQL (Prisma ORM can't write the `vector` type).
     * Text extraction and embedding are filled in separately by the background job.
     * Throws if neither `linkURL` nor `fileURI` is provided, or if both are provided.
     */
    public static async createContent(
        _name: string,
        _linkURL: string | null,
        _fileURI: string | null,
        _ownerId: number | null,
        _contentType: p.ContentType,
        _status: p.Status | null,
        _expiration: Date | null,
        _targetPersona: string,
        _tags: string[] = [],
    ): Promise<p.Content> {
        if (!_linkURL && !_fileURI) {
            throw new Error("Content must have either a linkURL or a fileURI")
        }
        if (_linkURL && _fileURI) {
            throw new Error("Content cannot have both a linkURL and a fileURI")
        }
        const _personaTyped: p.Persona | null = Helper.personaHelper(_targetPersona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const _statusTyped: p.Status = Helper.statusHelper(_status)
        const _createdDate: Date = new Date()
        const _lastModified: Date = new Date()

        // Prisma doesn't support vector type, so use $executeRaw to insert; text and embedding filled in background
        await prisma.$executeRaw`
        INSERT INTO "Content" (
            "displayName", "linkURL", "fileURI", "ownerId", "contentType",
            "status", "created", "lastModified", "expiration", "targetPersona", "tags"
        ) VALUES (
            ${_name}, ${_linkURL}, ${_fileURI}, ${_ownerId}, ${_contentType}::"ContentType",
            ${_statusTyped}::"Status", ${_createdDate}, ${_lastModified}, ${_expiration}, ${_personaTyped}::"Persona",
            ${_tags}::text[]
    )
`;

// fetch and return the created record
        return prisma.content.findFirst({
            where: { displayName: _name, fileURI: _fileURI, linkURL: _linkURL },
            orderBy: { id: 'desc' },
        }) as Promise<p.Content>;
    }

    /**
     * Hard-deletes a content item from the database.
     * `Bookmark` and `Preview` lack `onDelete: Cascade` in the schema, so they
     * are deleted in the same transaction to avoid FK constraint violations.
     */
    public static async permanentDeleteContent(id: number): Promise<void> {
        // Bookmark and Preview have no onDelete cascade, so clear them first.
        await prisma.$transaction([
            prisma.bookmark.deleteMany({ where: { bookmarkedContentId: id } }),
            prisma.preview.deleteMany({ where: { previewedContentId: id } }),
            prisma.content.delete({ where: { id } }),
        ]);
    }

    /** Updates only the tags array. Does not touch textContent or regenerate embeddings. */
    public static async updateTagsOnly(id: number, tags: string[]): Promise<void> {
        await prisma.content.update({ where: { id }, data: { tags } });
    }

    /** Marks an item as deleted and clears its checkout lock. */
    public static async softDeleteContent(id: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { deleted: true, checkedOutById: null, checkedOutAt: null },
        });
    }

    /** Clears the deleted flag, making the item visible in normal content queries again. */
    public static async restoreContent(id: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { deleted: false },
        });
    }

    /**
     * Returns all non-deleted content items.
     *
     * `unlinkedSR=true` restricts to items whose `serviceRequestId` is null — used by
     * ContentPicker in the SR form so users can only select content that isn't already
     * linked to another SR. Content owns the FK, so a plain scalar `null` check works
     * (no back-relation syntax needed here).
     */
    public static async queryAllContent(unlinkedSR = false) {
        return prisma.content.findMany({
            where: {
                deleted: false,
                ...(unlinkedSR ? { serviceRequestId: null } : {}),
            },
            select: {
                ...contentSelect,
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
            }
        })
    }

    /** Returns non-deleted content targeted at a persona. Admin persona returns all content. */
    public static async queryContentByPersona(persona: string) {
        if (persona == "admin") {
            return this.queryAllContent()
        }
        const _personaTyped: p.Persona | null = Helper.personaHelper(persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        return prisma.content.findMany({
            where: { targetPersona: _personaTyped, deleted: false },
            select: {
                ...contentSelect,
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
            }
        })
    }

    /**
     * Returns a single non-deleted content item with its linked service request.
     *
     * `serviceRequest` here is a forward relation (Content has `serviceRequestId` FK),
     * so `include: srInclude` works directly. `srInclude` is defined in helper.ts
     * rather than servicereqs.ts to avoid a circular import (servicereqs.ts → helper.ts,
     * content.ts → helper.ts is safe; content.ts → servicereqs.ts would be circular).
     */
    public static async queryContentById(_id: number) {
        return prisma.content.findUnique({
            where: { id: _id, deleted: false },
            select: {
                ...contentSelect,
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
                serviceRequest: { include: srInclude },
            }
        })
    }

    /**
     * Links a content item to a service request, or clears the link when `serviceRequestId` is null.
     *
     * Content owns the FK, so the link is always set here — never on the ServiceRequest row.
     * The DB enforces `@unique` on `serviceRequestId`; callers must ensure any previous link
     * is cleared before setting a new one to avoid a unique-constraint violation.
     */
    public static async setServiceRequest(contentId: number, serviceRequestId: number | null) {
        return prisma.content.update({
            where: { id: contentId },
            data: { serviceRequestId },
        });
    }

    /** Like `queryContentById` but includes the raw embedding vector — used by the background embedding job. */
    public static async queryContentByIdWithVectors(_id: number) {
        return prisma.content.findUnique({
            where: { id: _id, deleted: false },
            include: { owner: { select: employeeSelect }, checkedOutBy: { select: employeeSelect } }
        })
    }

    /** Looks up a single deleted item by ID. Returns `null` if not found or not deleted. */
    public static async queryDeletedContentById(id: number) {
        return prisma.content.findUnique({
            where: { id, deleted: true },
            select: {
                ...contentSelect,
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
            }
        });
    }

/**
     * Returns deleted items visible to the caller.
     * Admins see everything; non-admins only see items they own.
     */
    public static async queryDeletedContent(employeeId: number, adminAccess: boolean) {
        return prisma.content.findMany({
            where: {
                deleted: true,
                ...(!adminAccess && { ownerId: employeeId }),
            },
            select: {
                ...contentSelect,
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
            }
        });
    }


    /**
     * Acquires an optimistic checkout lock for the given employee.
     * Throws if the item is already checked out by a different employee, naming them in the error message.
     * Re-checking out as the same employee (e.g. after a page reload) is a no-op.
     */
    public static async checkoutContent(id: number, employeeID: number){
        const content = await prisma.content.findUnique({
            where: {id: id},
            include: {owner: { select: employeeSelect }, checkedOutBy: { select: employeeSelect },}
        })
        if (!content) {
            throw new Error("Content not found");
        }
        const locked = content.checkedOutById !== null && content.checkedOutById !== employeeID;
        if (locked) {
            const first = content.checkedOutBy?.firstName ?? "Someone";
            const last = content.checkedOutBy?.lastName ?? "";
            throw new Error(`${first} ${last}`.trim() + " is currently modifying this content.");
        }
        return prisma.content.update({
            where: { id },
            data: {
                checkedOutById: employeeID,
                checkedOutAt: new Date(),
            },
            include: {
                owner: { select: employeeSelect },
                checkedOutBy: { select: employeeSelect },
            },
        });
    }

    /** Releases the checkout lock without validating the caller — callers should verify ownership before calling. */
    public static async checkinContent(id: number, employeeID: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { checkedOutById: null, checkedOutAt: null }
        })
    }

    /** Full-text search using Postgres `ts_rank` and `ts_headline`. Returns up to 20 non-deleted results with a `snippet` field. */
    public static async searchContent(query: string): Promise<p.Content[]> {
        const results = await prisma.$queryRaw<p.Content[]>`
        SELECT
            id,
            "displayName",
            "linkURL",
            "fileURI",
            "contentType",
            "status",
            "targetPersona",
            "tags",
            "lastModified",
            "expiration",
            ts_rank("searchVector", plainto_tsquery('english', ${query})) AS rank,
            ts_headline(
                'english',
                "textContent",
                plainto_tsquery('english', ${query}),
                'MaxWords=50, MinWords=20'
            ) AS snippet
        FROM "Content"
        WHERE "searchVector" @@ plainto_tsquery('english', ${query}) AND "deleted" = false
        ORDER BY rank DESC
        LIMIT 20;
    `;
        return results;
    }
}
