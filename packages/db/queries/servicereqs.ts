import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";

export class ServiceReqs {
    public static async queryAllServiceReqs(): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({})
    }

    public static async queryAssignedServiceReqs(): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({
            where: {assigneeID: {not: null}}
        })
    }

    public static async queryServiceReqsByAssigned(id: number): Promise<p.ServiceRequest[]> {
        return prisma.serviceRequest.findMany({
            where: {assigneeID: id}
        })
    }
}