import { prisma } from "./lib/prisma";

async function main() {
    /*
    const employee = await prisma.serviceRequest.create({
        data: {
            id: 1001,
            firstName: "John",
            lastName: "Doe",
        }
    })

    console.log("Created employee:", employee);
     */

    const allEmployees = await prisma.employee.findMany({
    });
    console.log("All employees:", JSON.stringify(allEmployees, null, 2));
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });