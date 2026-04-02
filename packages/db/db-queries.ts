import { prisma } from "./lib/prisma"
import { Persona } from "./generated/prisma/client"

export async function queryAllEmployees() {
    const employees = await prisma.employee.findMany({})
    //return JSON.stringify(employees, null, 2)
    return employees
}

export async function queryEmployeeById(id: number) {
    const employees = await prisma.employee.findUnique({
        where: {id: id}
    })
    //return JSON.stringify(employees, null, 2)
    return employees
}

export async function queryServiceReqs() {
    const serviceReqs = await prisma.serviceRequest.findMany({})
    //return JSON.stringify(employees, null, 2)
    return serviceReqs
}

export async function queryServiceByAssigned(id: number) {
    const serviceReqs = await prisma.serviceRequest.findMany({
        where: {asigneeID: id}
    })
    //return JSON.stringify(employees, null, 2)
    return serviceReqs
}

export async function createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null) {
    const personaTyped = employeePersonaHelper(_persona)
    const employee = await prisma.employee.create({
        data: {
            id: _id,
            firstName: _firstName,
            lastName: _lastName,
            persona: personaTyped
        }
    })
}

function employeePersonaHelper(_persona: string | null) {
    if (_persona == "underwriter") { return Persona.underwriter }
    else if (_persona == "businessAnalyst") { return Persona.businessAnalyst }
    else { return null }
}

//TESTING
queryAllEmployees().then(
(employees) => {console.log("All employees:", employees)})

queryEmployeeById(1001).then(
    (employee) => {console.log("Employee 1001:", employee)}
)

queryServiceReqs().then(
    (serviceReqs) => {console.log("All requests:", serviceReqs)}
)

queryServiceByAssigned(1001).then(
    (serviceReqs) => {console.log("1001's requests:", serviceReqs)}
)

//createEmployee(27, "John", "NoRole").then(
//    () => queryAllEmployees().then(
//        (employees) => {console.log(employees)}))