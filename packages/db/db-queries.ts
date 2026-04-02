import { prisma } from "./lib/prisma"
import * as p from "./generated/prisma/client";

export function queryAllEmployees(): Promise<p.Employee[]> {
    return prisma.employee.findMany({})
}

export function queryEmployeeById(id: number): Promise<p.Employee | null> {
    return prisma.employee.findUnique({
        where: {id: id}
    })
}

export function queryAllServiceReqs(): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({})
}

export function queryAssignedServiceReqs(): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({
        where: {assigneeID: { not: null }}
    })
}

export function queryServiceReqByAssigned(id: number): Promise<p.ServiceRequest[]> {
    return prisma.serviceRequest.findMany({
        where: {assigneeID: id}
    })
}

export function queryObjectsByBucket(name: string): Promise<p.objects[]> {
    return prisma.objects.findMany({
        where: {
            bucket_id: name
        },
    })
}

export async function createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<void> {
    const personaTyped: p.Persona | null = employeePersonaHelper(_persona)
    await prisma.employee.create({
        data: {
            id: _id,
            firstName: _firstName,
            lastName: _lastName,
            persona: personaTyped
        }
    })
}

function employeePersonaHelper(_persona: string | null): p.Persona | null {
    if (_persona == "underwriter") { return p.Persona.underwriter }
    else if (_persona == "businessAnalyst") { return p.Persona.businessAnalyst }
    else { return null }
}

//call this function to test the queries, do not call otherwise
function testQueries() {
    queryAllEmployees().then(
        (employees) => {console.log("All employees:", employees)})

    queryEmployeeById(1001).then(
        (employee) => {console.log("Employee 1001:", employee)}
    )

    queryAllServiceReqs().then(
        (serviceReqs) => {console.log("All requests:", serviceReqs)}
    )

    queryAssignedServiceReqs().then(
        (serviceReqs) => {console.log("Assigned requests:", serviceReqs)}
    )

    queryServiceReqByAssigned(1001).then(
        (serviceReqs) => {console.log("1001's requests:", serviceReqs)}
    )

    //createEmployee(27, "John", "NoRole").then(
    //    () => queryAllEmployees().then(
    //        (employees) => {console.log(employees)}))
}
