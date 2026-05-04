/**
 * Backfills embeddings for all entity types. Assumes textContent is already
 * populated for Content rows (run backfill-text.ts first if needed).
 *
 * Usage:
 *   pnpm --filter backend exec tsx scripts/backfill.ts [--target=content|employee|collection|servicereq] [--force]
 *
 * --target  Run only one entity type (default: all four)
 * --force   Re-embed rows that already have an embedding
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

// Dynamic imports so dotenv runs before @softeng-app/db initialises Prisma
const { prisma, embeddingToSql } = await import('@softeng-app/db');
const { generateEmbedding } = await import('../lib/embeddings.js');
const { buildContentEmbeddingInput, buildEmployeeEmbeddingInput, buildCollectionEmbeddingInput, buildServiceReqEmbeddingInput } = await import('../lib/embeddingInputs.js');

const force = process.argv.includes('--force');
const targetArg = process.argv.find(a => a.startsWith('--target='))?.split('=')[1];

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

async function backfillContent() {
    const rows = force
        ? await prisma.$queryRaw<any[]>`
            SELECT id, "displayName", "contentType", "targetPersona", "tags", status::text, "fileURI", "textContent"
            FROM "Content"
            WHERE "textContent" IS NOT NULL`
        : await prisma.$queryRaw<any[]>`
            SELECT id, "displayName", "contentType", "targetPersona", "tags", status::text, "fileURI", "textContent"
            FROM "Content"
            WHERE "textContent" IS NOT NULL AND "embedding" IS NULL`;

    console.log(`\n[Content] ${rows.length} rows`);
    let success = 0, skipped = 0, failed = 0;

    for (const item of rows) {
        try {
            const embedding = await generateEmbedding(buildContentEmbeddingInput(
                item.displayName, item.contentType, item.targetPersona, item.tags ?? [], item.status, item.fileURI ?? null, item.textContent,
            ));
            await prisma.$executeRaw`UPDATE "Content" SET "embedding" = ${embeddingToSql(embedding)}::vector WHERE id = ${item.id}`;
            console.log(`  [${item.id}] "${item.displayName}"`);
            success++;
        } catch (err) {
            console.error(`  [${item.id}] error:`, err);
            failed++;
        }
    }
    console.log(`  Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
}

// ---------------------------------------------------------------------------
// Employee
// ---------------------------------------------------------------------------

async function backfillEmployees() {
    const rows = force
        ? await prisma.$queryRaw<{ id: number; firstName: string; lastName: string; persona: string }[]>`
            SELECT id, "firstName", "lastName", persona::text FROM "Employee"`
        : await prisma.$queryRaw<{ id: number; firstName: string; lastName: string; persona: string }[]>`
            SELECT id, "firstName", "lastName", persona::text FROM "Employee"
            WHERE embedding IS NULL`;

    console.log(`\n[Employee] ${rows.length} rows`);
    let success = 0, failed = 0;
    for (const row of rows) {
        try {
            const embedding = await generateEmbedding(buildEmployeeEmbeddingInput(row.firstName, row.lastName, row.persona));
            await prisma.$executeRaw`UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            console.log(`  [${row.id}] ${row.firstName} ${row.lastName}`);
            success++;
        } catch (err) { console.error(`  [${row.id}] error:`, err); failed++; }
    }
    console.log(`  Success: ${success}, Failed: ${failed}`);
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

async function backfillCollections() {
    const rows = force
        ? await prisma.$queryRaw<{ id: number; displayName: string; itemNames: string[] }[]>`
            SELECT c.id, c."displayName",
                   COALESCE(ARRAY_AGG(cont."displayName" ORDER BY ci.position) FILTER (WHERE ci."contentId" IS NOT NULL), '{}') AS "itemNames"
            FROM "Collection" c
            LEFT JOIN "CollectionItem" ci ON ci."collectionId" = c.id
            LEFT JOIN "Content" cont ON cont.id = ci."contentId" AND cont.deleted = false
            GROUP BY c.id`
        : await prisma.$queryRaw<{ id: number; displayName: string; itemNames: string[] }[]>`
            SELECT c.id, c."displayName",
                   COALESCE(ARRAY_AGG(cont."displayName" ORDER BY ci.position) FILTER (WHERE ci."contentId" IS NOT NULL), '{}') AS "itemNames"
            FROM "Collection" c
            LEFT JOIN "CollectionItem" ci ON ci."collectionId" = c.id
            LEFT JOIN "Content" cont ON cont.id = ci."contentId" AND cont.deleted = false
            WHERE c.embedding IS NULL
            GROUP BY c.id`;

    console.log(`\n[Collection] ${rows.length} rows`);
    let success = 0, failed = 0;
    for (const row of rows) {
        try {
            const embedding = await generateEmbedding(buildCollectionEmbeddingInput(row.displayName, row.itemNames ?? []));
            await prisma.$executeRaw`UPDATE "Collection" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            console.log(`  [${row.id}] "${row.displayName}"`);
            success++;
        } catch (err) { console.error(`  [${row.id}] error:`, err); failed++; }
    }
    console.log(`  Success: ${success}, Failed: ${failed}`);
}

// ---------------------------------------------------------------------------
// ServiceRequest
// ---------------------------------------------------------------------------

async function backfillServiceReqs() {
    const rows = force
        ? await prisma.$queryRaw<{ id: number; name: string | null; type: string; notes: string | null }[]>`
            SELECT id, name, type::text, notes FROM "ServiceRequest"`
        : await prisma.$queryRaw<{ id: number; name: string | null; type: string; notes: string | null }[]>`
            SELECT id, name, type::text, notes FROM "ServiceRequest"
            WHERE embedding IS NULL`;

    console.log(`\n[ServiceRequest] ${rows.length} rows`);
    let success = 0, failed = 0;
    for (const row of rows) {
        try {
            const embedding = await generateEmbedding(buildServiceReqEmbeddingInput(row.name, row.type, row.notes));
            await prisma.$executeRaw`UPDATE "ServiceRequest" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${row.id}`;
            console.log(`  [${row.id}] "${row.name ?? '(unnamed)'}"`);
            success++;
        } catch (err) { console.error(`  [${row.id}] error:`, err); failed++; }
    }
    console.log(`  Success: ${success}, Failed: ${failed}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log(`Backfill — target: ${targetArg ?? 'all'}, force: ${force}`);

    if (!targetArg || targetArg === 'content')    await backfillContent();
    if (!targetArg || targetArg === 'employee')   await backfillEmployees();
    if (!targetArg || targetArg === 'collection') await backfillCollections();
    if (!targetArg || targetArg === 'servicereq') await backfillServiceReqs();

    console.log('\nDone.');
    await prisma.$disconnect();
}

main();
