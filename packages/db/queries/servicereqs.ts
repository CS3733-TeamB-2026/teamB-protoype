import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect, srInclude} from "./helper";

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
        _name: string, _created: Date, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null,
    ): Promise<p.ServiceRequest> {
        const _type: p.RequestType = Helper.requestHelper(_type_string);
        return prisma.serviceRequest.create({
            data: {
                name: _name,
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId,
                notes: _notes ?? null,
            },
        });
    }

    public static async updateServiceReq(
        _id: number, _name: string, _created: Date, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null,
    ): Promise<p.ServiceRequest> {
        const _type: p.RequestType | null = Helper.requestHelper(_type_string);
        if (_type == null) throw new Error("Service Request type not specified");
        return prisma.serviceRequest.update({
            where: { id: _id },
            data: {
                name: _name,
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId,
                notes: _notes ?? null,
            },
        });
    }

    public static async deleteServiceReq(_id: number): Promise<void> {
        await prisma.serviceRequest.delete({
            where: {id: _id},
        })
    }
}
