import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect} from "./helper";

export class ServiceReqs {

    /**
     * Shared Prisma include used by every query and mutation so the response always
     * carries the full shape the frontend expects: owner/assignee employee fields,
     * the linked content item, and the linked collection with its items.
     *
     * `linkedCollection` needs the nested `items → content` include because
     * `CollectionCard` reads `collection.items.length` — a shallow `true` would
     * omit that join and crash the card.
     */
    private static readonly include = {
        owner: { select: employeeSelect },
        assignee: { select: employeeSelect },
        linkedContent: true,
        linkedCollection: {
            include: {
                items: {
                    where: { content: { deleted: false } },
                    include: { content: true },
                },
            },
        },
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

    public static async createServiceReq(
        _name: string, _created: Date, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null, _linkedContentId?: number | null, _linkedCollectionId?: number | null,
    ): Promise<p.ServiceRequest> {
        if (_linkedContentId && _linkedCollectionId)
            throw new Error("A service request cannot link both a content item and a collection.");
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
                linkedContentId: _linkedContentId ?? null,
                linkedCollectionId: _linkedCollectionId ?? null,
            },
            include: ServiceReqs.include,
        });
    }

    public static async updateServiceReq(
        _id: number, _name: string, _created: Date, _deadline: Date, _type_string: string,
        _assigneeId: number, _ownerId: number,
        _notes?: string | null, _linkedContentId?: number | null, _linkedCollectionId?: number | null,
    ): Promise<p.ServiceRequest> {
        if (_linkedContentId && _linkedCollectionId)
            throw new Error("A service request cannot link both a content item and a collection.");
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
                linkedContentId: _linkedContentId ?? null,
                linkedCollectionId: _linkedCollectionId ?? null,
            },
            include: ServiceReqs.include,
        });
    }

    public static async deleteServiceReq(_id: number): Promise<void> {
        await prisma.serviceRequest.delete({
            where: {id: _id},
        })
    }
}