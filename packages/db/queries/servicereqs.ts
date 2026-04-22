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
        _name: string, _created: Date, _deadline: Date, _type_string: string, _assigneeId: number, _ownerId: number): Promise<p.ServiceRequest> {
        let _type: p.RequestType = Helper.requestHelper(_type_string)
        return prisma.serviceRequest.create({
            data: {
                name: _name,
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId
            }
        })
    }

    public static async updateServiceReq(
        _id: number, _name: string, _created: Date, _deadline: Date, _type_string: string, _assigneeId: number, _ownerId: number): Promise<p.ServiceRequest> {
        let _type: p.RequestType | null = Helper.requestHelper(_type_string)
        if (_type == null) {
            throw new Error("Service Request type not specified")
        }
        return prisma.serviceRequest.update({
            where: {id: _id},
            data: {
                name: _name,
                created: _created,
                deadline: _deadline,
                type: _type,
                assigneeId: _assigneeId,
                ownerId: _ownerId
            }
        })
    }

    public static async deleteServiceReq(_id: number): Promise<void> {
        await prisma.serviceRequest.delete({
            where: {id: _id},
        })
    }
}