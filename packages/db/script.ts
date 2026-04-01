import { prisma } from "./lib/prisma";

async function main() {
    const file = await prisma.TestFile.create({
        data: {
            name: "myReport",
            type: "pdf",
        }
    })

    console.log("Created file:", file);

    // Fetch all users with their posts
    const allFiles = await prisma.TestFile.findMany({
    });
    console.log("All files:", JSON.stringify(allFiles, null, 2));
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