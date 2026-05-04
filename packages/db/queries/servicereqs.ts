import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect, srInclude} from "./helper";
import { generateEmbedding, embeddingToSql } from '../lib/embeddings';

export class ServiceReqs {

    /**
     * Shared Prisma include for all SR queries. `linkedContent` and `linkedCollection`
     * are back-relations (the FK lives on Content and Collection respectively), so
     * Prisma resolves them by scanning those tables for rows whose `serviceRequestId`
     * matches — the include syntax is unchanged from a forward-relation include.
     *
     * `linkedCollection` carries nested items so that CollectionCard can read
     * `collection.items.length` without a second fetch.
     */
    private static readonly include = {
        owner: { select: employeeSelect },
        assignee: { select: employeeSelect },
        linkedContent: { select: { ...srInclude.linkedContent.select } },
        linkedCollection: srInclude.linkedCollection,
    } as const;

    /** Returns a single service request with all relations — used for ownership checks before update/delete. */
    public static async queryServiceReqById(id: number) {
        return prisma.serviceRequest.findUnique({
            where: { id },
            include: ServiceReqs.include,
        });
    }

    public static async queryAllServiceReqs() {
        return prisma.serviceRequest.findMany({ include: ServiceReqs.include });
    }

    public static async queryAssignedServiceReqs() {
        return prisma.serviceRequest.findMany({
            where: { assigneeId: { not: null } },
            include: ServiceReqs.include,
        });
    }

    public static async queryServiceReqsByAssigned(id: number) {
        return prisma.serviceRequest.findMany({
            where: { assigneeId: id },
            include: ServiceReqs.include,
        });
    }

    /** Returns the service request linked to the given content item, if any. */
    public static async queryByContentId(contentId: number) {
        return prisma.serviceRequest.findMany({
            where: { linkedContent: { is: { id: contentId } } },
            include: ServiceReqs.include,
        });
    }

    /** Returns the service request linked to the given collection, if any. */
    public static async queryByCollectionId(collectionId: number) {
        return prisma.serviceRequest.findMany({
            where: { linkedCollection: { is: { id: collectionId } } },
            include: ServiceReqs.include,
        });
    }

    /** Semantic vector search over all service requests. Returns up to 20 results with `similarity` score (0–1). */
    public static async semanticSearch(query: string) {
        const embedding = await generateEmbedding(query);
        const embeddingStr = embeddingToSql(embedding);

        const rows = await prisma.$queryRaw<{ id: number; similarity: number }[]>`
            SELECT id, 1 - (embedding <=> ${embeddingStr}::vector) AS similarity
            FROM "ServiceRequest"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT 20
        `;

        const ids = rows.map(r => r.id);
        const similarityMap = new Map(rows.map(r => [r.id, Number(r.similarity)]));

        const requests = await prisma.serviceRequest.findMany({
            where: { id: { in: ids } },
            include: ServiceReqs.include,
        });

        return requests
            .map(sr => ({ ...sr, similarity: similarityMap.get(sr.id) ?? 0 }))
            .sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Returns service requests not linked to any content item or collection.
     *
     * `{ is: null }` is Prisma's back-relation null-check syntax — it matches rows
     * where no Content or Collection row points at this SR via `serviceRequestId`.
     * A plain `{ serviceRequestId: null }` would fail because the FK doesn't live
     * on the ServiceRequest table.
     */
    public static async queryUnlinked() {
        return prisma.serviceRequest.findMany({
            where: {
                linkedContent: { is: null },
                linkedCollection: { is: null },
            },
            include: ServiceReqs.include,
        });
    }

    /**
     * Creates a new service request without linking it to any content or collection.
     *
     * Because `linkedContent` and `linkedCollection` are back-relations (FK lives on
     * those tables), they cannot be set during SR creation. The caller — typically the
     * `createServiceReq` backend hook — must call `Content.setServiceRequest` or
     * `Collection.setServiceRequest` in a separate step after this returns.
     */
    public static async createServiceReq(
        _name: string, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null,
    ): Promise<p.ServiceRequest> {
        const _type: p.RequestType = Helper.requestHelper(_type_string);
        const result = await prisma.serviceRequest.create({
            data: {
                name: _name,
                // created defaults to now() at the DB level; not caller-supplied
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId,
                notes: _notes ?? null,
            },
        });

        setImmediate(async () => {
            try {
                const embeddingInput = [_name, _type, _notes ?? ''].join(' ');
                const embedding = await generateEmbedding(embeddingInput);
                await prisma.$executeRaw`
                    UPDATE "ServiceRequest" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${result.id}
                `;
            } catch (err) {
                console.error(`[background] Failed to embed service request id=${result.id}:`, err);
            }
        });

        return result;
    }

    public static async updateServiceReq(
        _id: number, _name: string, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null,
    ): Promise<p.ServiceRequest> {
        const _type: p.RequestType | null = Helper.requestHelper(_type_string);
        if (_type == null) throw new Error("Service Request type not specified");
        const result = await prisma.serviceRequest.update({
            where: { id: _id },
            data: {
                name: _name,
                // created is intentionally omitted — the original timestamp is never overwritten
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId,
                notes: _notes ?? null,
            },
        });

        setImmediate(async () => {
            try {
                const embeddingInput = [_name, _type, _notes ?? ''].join(' ');
                const embedding = await generateEmbedding(embeddingInput);
                await prisma.$executeRaw`
                    UPDATE "ServiceRequest" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${_id}
                `;
            } catch (err) {
                console.error(`[background] Failed to embed service request id=${_id}:`, err);
            }
        });

        return result;
    }

    public static async deleteServiceReq(_id: number): Promise<void> {
        await prisma.serviceRequest.delete({
            where: {id: _id},
        })
    }
}
