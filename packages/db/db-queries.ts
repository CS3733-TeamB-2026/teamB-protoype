import { prisma } from "./lib/prisma"
import * as p from "./generated/prisma/client";

export async function queryAllEmployees(): Promise<p.Employee[]> {
    return prisma.employee.findMany({})
}

export async function queryEmployeeById(id: number): Promise<p.Employee | null> {
    return prisma.employee.findUnique({
        where: {id: id}
    })
}

export async function queryAllContent(): Promise<p.Content[]> {
    return prisma.content.findMany({})
}

export async function queryAllServiceReqs(): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({})
}

export async function queryAssignedServiceReqs(): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({
        where: {assigneeID: {not: null}}
    })
}

export async function queryServiceReqsByAssigned(id: number): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({
        where: {assigneeID: id}
    })
}

export async function queryObjectsByBucket(name: string): Promise<p.objects[]> {
    return prisma.objects.findMany({
        where: {
            bucket_id: name
        },
    })
}

export async function createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<void> {
    const _personaTyped: p.Persona | null = employeePersonaHelper(_persona)
    await prisma.employee.create({
        data: {
            id: _id,
            firstName: _firstName,
            lastName: _lastName,
            persona: _personaTyped
        }
    })
}

function employeePersonaHelper(_persona: string | null): p.Persona | null {
    if (_persona == "underwriter") { return p.Persona.underwriter }
    else if (_persona == "businessAnalyst") { return p.Persona.businessAnalyst }
    else { return null }
}

export async function createContent(
    _name: string,
    _linkURL: string | null,
    _ownerID: number | null,
    _contentType: p.ContentType,
    _status: p.Status | null,
    _lastModified: Date,
    _expiration: Date | null,
    _jobPosition: string,
): Promise<p.Content> {
    return prisma.content.create({
        data: {
            name: _name,
            linkURL: _linkURL,
            ownerID: _ownerID,
            contentType: _contentType,
            status: _status,
            lastModified: _lastModified,
            expiration: _expiration,
            jobPosition: _jobPosition
        }
    })
}