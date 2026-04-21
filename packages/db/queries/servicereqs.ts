import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper} from "./helper";

export class ServiceReqs {
    public static async queryAllServiceReqs(): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({})
    }

    public static async queryAssignedServiceReqs(): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({
            where: {assigneeId: {not: null}}
        })
    }

    public static async queryServiceReqsByAssigned(id: number): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({
            where: {assigneeId: id}
        })
    }

    public static async createServiceReq(
        _created: Date, _deadline: Date, _type_string: string, _assignee: number, _owner: number): Promise<void> {
        let _type: p.RequestType | null = Helper.requestHelper(_type_string)
        if (_type == null) {
            throw new Error("Service Request type not specified")
        }
        await prisma.serviceRequest.create({
            data: {
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assignee,
                ownerId: _owner
            }
        })
    }

    public static async updateServiceReq(
        _id: number, _created: Date, _deadline: Date, _type_string: string, _assignee: number, _owner: number): Promise<void> {
        let _type: p.RequestType | null = Helper.requestHelper(_type_string)
        if (_type == null) {
            throw new Error("Service Request type not specified")
        }
        await prisma.serviceRequest.update({
            where: {id: _id},
            data: {
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assignee,
                ownerId: _owner
            }
        })
    }

    public static async deleteServiceReq(_id: number): Promise<void> {
        await prisma.serviceRequest.delete({
            where: {id: _id},
        })
    }
}