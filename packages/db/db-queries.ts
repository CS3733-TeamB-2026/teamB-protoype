import { prisma } from "./lib/prisma"

export async function queryAllEmployees() {
    const employees = await prisma.employee.findMany({})
    //return JSON.stringify(employees, null, 2)
    return employees
}

queryAllEmployees().then(
    (employees) => {console.log(employees)}
)