import "dotenv/config";
import { prismaReadOnly } from "../lib/prisma";

async function main() {
    const rows = await prismaReadOnly.$queryRawUnsafe<unknown[]>(
        `SELECT id, "firstName", "lastName" FROM "Employee" LIMIT 3;`
    );
    console.log(rows);

    console.log("\n--- Testing DELETE (should fail with permission denied) ---");
    try {
        await prismaReadOnly.$executeRawUnsafe(
            `DELETE FROM "Employee" WHERE 1 = 0;`
        );
        console.error("❌ DELETE SUCCEEDED — read-only user has too much permission!");
    } catch (err) {
        console.log("✅ DELETE rejected as expected:", (err as Error).message);
    }

    await prismaReadOnly.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});