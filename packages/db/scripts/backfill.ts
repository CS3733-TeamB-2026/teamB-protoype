/**
 * Backfills text content and embeddings for all entity types.
 *
 * Usage:
 *   pnpm --filter db exec tsx scripts/backfill.ts [--target content|employee|collection|servicereq] [--force]
 *
 * --target  Run only one entity type (default: all four)
 * --force   Re-embed rows that already have an embedding
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../apps/backend/.env') });

import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { generateEmbedding, embeddingToSql } from '../lib/embeddings';
import {
    buildContentEmbeddingInput,
    buildEmployeeEmbeddingInput,
    buildCollectionEmbeddingInput,
    buildServiceReqEmbeddingInput,
} from '../lib/embeddingInputs';
import { extractText, SupportedMimeType } from '../../../apps/backend/lib/extractors';
import mime from 'mime-types';

const force = process.argv.includes('--force');
const targetArg = process.argv.find(a => a.startsWith('--target='))?.split('=')[1];

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

async function backfillContent() {
    const rows = await prisma.$queryRaw<any[]>`
        SELECT id, "displayName", "fileURI", "linkURL", "contentType", "targetPersona", "tags", "textContent"
        FROM "Content"
        WHERE ${force ? prisma.$queryRaw`TRUE` : prisma.$queryRaw`"textContent" IS NULL OR "embedding" IS NULL`}
    `;

    console.log(`\n[Content] ${rows.length} rows`);
    let success = 0, skipped = 0, failed = 0;

    for (const item of rows) {
        try {
            let textContent: string | null = item.textContent;

            if (!textContent) {
                if (item.fileURI) {
                    const { data, error } = await supabase.storage.from('content').download(item.fileURI);
                    if (error || !data) {
                        console.warn(`  [${item.id}] skipped — download failed:`, error?.message);
                        skipped++; continue;
                    }
                    const mimeType = mime.lookup(item.fileURI) || null;
                    if (!mimeType) {
                        console.warn(`  [${item.id}] skipped — unknown MIME type`);
                        skipped++; continue;
                    }
                    textContent = await extractText(Buffer.from(await data.arrayBuffer()), mimeType as SupportedMimeType);
                } else if (item.linkURL) {
                    textContent = await extractText(null, 'url', item.linkURL);
                } else {
                    console.warn(`  [${item.id}] skipped — no fileURI or linkURL`);
                    skipped++; continue;
                }
                await prisma.content.update({ where: { id: item.id }, data: { textContent } });
            }

            const embedding = await generateEmbedding(buildContentEmbeddingInput(
                item.displayName, item.contentType, item.targetPersona, item.tags ?? [], textContent,
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
    const rows = await prisma.$queryRaw<{ id: number; firstName: string; lastName: string; persona: string }[]>`
        SELECT id, "firstName", "lastName", persona::text FROM "Employee"
        WHERE ${force ? prisma.$queryRaw`TRUE` : prisma.$queryRaw`embedding IS NULL`}
    `;
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
    const rows = await prisma.$queryRaw<{ id: number; displayName: string }[]>`
        SELECT id, "displayName" FROM "Collection"
        WHERE ${force ? prisma.$queryRaw`TRUE` : prisma.$queryRaw`embedding IS NULL`}
    `;
    console.log(`\n[Collection] ${rows.length} rows`);
    let success = 0, failed = 0;
    for (const row of rows) {
        try {
            const embedding = await generateEmbedding(buildCollectionEmbeddingInput(row.displayName));
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
    const rows = await prisma.$queryRaw<{ id: number; name: string | null; type: string; notes: string | null }[]>`
        SELECT id, name, type::text, notes FROM "ServiceRequest"
        WHERE ${force ? prisma.$queryRaw`TRUE` : prisma.$queryRaw`embedding IS NULL`}
    `;
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
