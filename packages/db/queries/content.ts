import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect, contentSelect, srInclude} from "./helper";
import { Notification } from "./notification";
import { generateEmbedding, embeddingToSql } from '../../../apps/backend/lib/embeddings';

/** Concatenates the indexable fields into a single string for embedding generation. */
function buildEmbeddingInput(
    name: string,
    contentType: string,
    persona: string,
    tags: string[],
    textContent: string | null
): string {
    return [
        name,
        contentType,
        persona,
        tags.join(' '),
        textContent ?? '',
    ].join(' ');
}

/**
 * Query class for the `Content` table.
 *
 * All read queries filter `deleted = false` by default. Deleted items are only
 * visible via `queryDeletedContent` / `queryDeletedContentById`. Raw SQL is used
 * in a few places because Prisma's ORM layer doesn't support the `vector` type
 * or full-text search ranking (`ts_rank`).
 */
export class Content {
    public static async semanticSearch(query: string): Promise<p.Content[]> {
        const embedding = await generateEmbedding(query);
        const embeddingStr = embeddingToSql(embedding);

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
        LIMIT 20;
    `;
    }

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
        _textContent: string | null = null,
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

        const embeddingInput = buildEmbeddingInput(_name, _contentType, _personaTyped, _tags, _textContent);
        const embedding = await generateEmbedding(embeddingInput);

        await prisma.$executeRaw`
            UPDATE "Content" SET "embedding" = ${embeddingToSql(embedding)}::vector
            WHERE id = ${id}
        `;

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
                textContent: _textContent,
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
        _textContent: string | null = null,
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

        const embeddingInput = buildEmbeddingInput(_name, _contentType, _personaTyped, _tags, _textContent);
        const embedding = await generateEmbedding(embeddingInput);

        // Prisma doesn't support vector type, use $executeRaw to insert then return
        await prisma.$executeRaw`
        INSERT INTO "Content" (
            "displayName", "linkURL", "fileURI", "ownerId", "contentType",
            "status", "created", "lastModified", "expiration", "targetPersona", "tags",
            "textContent", "embedding"
        ) VALUES (
            ${_name}, ${_linkURL}, ${_fileURI}, ${_ownerId}, ${_contentType}::"ContentType",
            ${_statusTyped}::"Status", ${_createdDate}, ${_lastModified}, ${_expiration}, ${_personaTyped}::"Persona",
            ${_tags}::text[], ${_textContent}, ${embeddingToSql(embedding)}::vector
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

    /** Links a content item to a service request, or clears the link when serviceRequestId is null. */
    public static async setServiceRequest(contentId: number, serviceRequestId: number | null) {
        return prisma.content.update({
            where: { id: contentId },
            data: { serviceRequestId },
        });
    }

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

    public static async checkinContent(id: number, employeeID: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { checkedOutById: null, checkedOutAt: null }
        })
    }

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
