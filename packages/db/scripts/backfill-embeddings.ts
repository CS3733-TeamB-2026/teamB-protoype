/**
 * Backfills embeddings for Employee, Collection, and ServiceRequest rows that
 * don't have an embedding yet. Run after adding the embedding columns via
 * `prisma db push`.
 *
 * Usage: pnpm --filter db exec ts-node scripts/backfill-embeddings.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../apps/backend/.env') });

import { prisma } from '../lib/prisma';
import { generateEmbedding, embeddingToSql } from '../../../apps/backend/lib/embeddings';

async function backfillTable(
    label: string,
    rows: { id: number; text: string }[],
    table: "Employee" | "Collection" | "ServiceRequest",
) {
    console.log(`\n[${label}] ${rows.length} rows to embed`);
    let success = 0, failed = 0;

    for (const row of rows) {
        try {
            const embedding = await generateEmbedding(row.text);
            if (table === "Employee") {
                await prisma.$executeRaw`UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            } else if (table === "Collection") {
                await prisma.$executeRaw`UPDATE "Collection" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            } else {
                await prisma.$executeRaw`UPDATE "ServiceRequest" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            }
            console.log(`  [${row.id}] ok`);
            success++;
        } catch (err) {
            console.error(`  [${row.id}] failed:`, err);
            failed++;
        }
    }

    console.log(`  Success: ${success}, Failed: ${failed}`);
}

async function main() {
    const [employees, collections, serviceReqs] = await Promise.all([
        prisma.$queryRaw<{ id: number; firstName: string; lastName: string; persona: string }[]>`
            SELECT id, "firstName", "lastName", persona::text FROM "Employee" WHERE embedding IS NULL
        `,
        prisma.$queryRaw<{ id: number; displayName: string }[]>`
            SELECT id, "displayName" FROM "Collection" WHERE embedding IS NULL
        `,
        prisma.$queryRaw<{ id: number; name: string | null; type: string; notes: string | null }[]>`
            SELECT id, name, type::text, notes FROM "ServiceRequest" WHERE embedding IS NULL
        `,
    ]);

    await backfillTable(
        'Employee',
        employees.map(e => ({ id: e.id, text: `${e.firstName} ${e.lastName} ${e.persona}` })),
        'Employee',
    );

    await backfillTable(
        'Collection',
        collections.map(c => ({ id: c.id, text: c.displayName })),
        'Collection',
    );

    await backfillTable(
        'ServiceRequest',
        serviceReqs.map(sr => ({ id: sr.id, text: [sr.name ?? '', sr.type, sr.notes ?? ''].join(' ') })),
        'ServiceRequest',
    );

    console.log('\nBackfill complete.');
    await prisma.$disconnect();
}

main();
