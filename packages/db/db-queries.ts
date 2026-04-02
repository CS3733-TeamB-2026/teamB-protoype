import { prisma } from "./lib/prisma"

export async function queryAllEmployees() {
    const employees = await prisma.employee.findMany({})
    //return JSON.stringify(employees, null, 2)
    return employees
}

queryAllEmployees().then(
    (employees) => {console.log(employees)}
)

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


queryEmployeeById(1001).then(
    (employee) => {console.log(employee)}
)

queryServiceReqs().then(
    (serviceReqs) => {console.log(serviceReqs)}
)

queryServiceByAssigned(1001).then(
    (serviceReqs) => {console.log(serviceReqs)}
)