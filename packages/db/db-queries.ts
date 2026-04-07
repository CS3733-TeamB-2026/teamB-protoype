import { prisma } from "./lib/prisma"
import * as p from "./generated/prisma/client";


// Employee Queries
export async function queryAllEmployees(): Promise<p.Employee[]> {
    return prisma.employee.findMany({})
}

export async function queryEmployeeById(id: number): Promise<p.Employee | null> {
    return prisma.employee.findUnique({
        where: {id: id}
    })
}


// Content Queries
export async function queryAllContent(): Promise<p.Content[]> {
    return prisma.content.findMany({})
}

export async function queryContentByName(name: string): Promise<p.Content | null> {
    return prisma.content.findUnique({
        where: {name: name}
        //TODO: Maybe add case insensitivity
    })
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

/*
export async function queryObjectsByBucket(name: string): Promise<p.objects[]> {
    return prisma.objects.findMany({
        where: {
            bucket_id: name
        },
    })
}

 */

export async function createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<void> {
    const _personaTyped: p.Persona = personaHelper(_persona)
    await prisma.employee.create({
        data: {
            id: _id,
            firstName: _firstName,
            lastName: _lastName,
            persona: _personaTyped
        }
    })
}

function personaHelper(_persona: string | null): p.Persona {
    if (_persona == "underwriter") { return p.Persona.underwriter }
    else if (_persona == "businessAnalyst") { return p.Persona.businessAnalyst }
    else if(_persona == "admin") { return p.Persona.admin }
    else {
        return p.Persona.admin
        //TODO: figure out a default return
    }

}

function statusHelper(_status: string | null): p.Status {
    if (_status == "new") { return p.Status.new }
    else if (_status == "inProgress") { return p.Status.inProgress }
    else if(_status == "complete") { return p.Status.complete }
    else {
        return p.Status.new
        //TODO: figure out a default return
    }

}

export async function createContent(
    _name: string,
    _linkURL: string | null,
    _ownerID: number | null,
    _contentType: p.ContentType,
    _status: p.Status | null,
    _lastModified: Date,
    _expiration: Date | null,
    _targetPersona: string,
): Promise<p.Content> {
    const _personaTyped: p.Persona = personaHelper(_targetPersona)
    const _statusTyped: p.Status = statusHelper(_status)
    return prisma.content.create({
        data: {
            name: _name,
            linkURL: _linkURL,
            ownerID: _ownerID,
            contentType: _contentType,
            status: _statusTyped,
            lastModified: _lastModified,
            expiration: _expiration,
            targetPersona: _personaTyped,
        }
    })
}