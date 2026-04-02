import { prisma } from "./lib/prisma"
import { Persona } from "./generated/prisma/client"

export async function queryAllEmployees() {
    const employees = await prisma.employee.findMany({})
    //return JSON.stringify(employees, null, 2)
    return employees
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

//queryAllEmployees().then(
    //(employees) => {console.log(employees)})

//createEmployee(27, "John", "NoRole").then(
//    () => queryAllEmployees().then(
//        (employees) => {console.log(employees)}))
