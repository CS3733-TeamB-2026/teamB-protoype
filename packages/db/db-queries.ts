import { prisma } from "./lib/prisma"

async function queryAllEmployees() {
    const employees = await prisma.employee.findMany({});
    return employees;
}

const employees = queryAllEmployees()
    .then(async () => {
    await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
console.log("All employees:", JSON.stringify(employees, null, 2));