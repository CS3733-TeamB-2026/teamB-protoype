import { prisma } from "./lib/prisma";

async function main() {

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