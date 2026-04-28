import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../apps/backend/.env') });

import { prisma } from '../../../packages/db/lib/prisma';
import { generateEmbedding, embeddingToSql } from '../lib/embeddings';

import * as p from "../../../packages/db/generated/prisma/client";

function buildEmbeddingInput(
    name: string,
    contentType: string,
    persona: string,
    tags: string[],
    textContent: string | null
): string {
    return [
        name,
        contentType,
        persona,
        tags.join(' '),
        textContent ?? '',
    ].join(' ');
}

async function backfillEmbeddings() {
    console.log('Fetching content records without embeddings...');

    const allContent = await prisma.$queryRaw<p.Content[]>`
        SELECT
            id,
            "displayName",
            "linkURL",
            "fileURI",
            "contentType",
            "status",
            "targetPersona",
            "tags",
            "lastModified",
            "expiration",
            "textContent",
            "ownerId",
            "checkedOutById",
            "checkedOutAt",
            "hits",
            "searchVector"::text,
            "embedding"::text
        FROM "Content"
        WHERE "embedding" IS NULL
    `;

    console.log(`Found ${allContent.length} records to process.\n`);

    let success = 0;
    let failed = 0;

    for (const item of allContent) {
        try {
            const embeddingInput = buildEmbeddingInput(
                item.displayName,
                item.contentType,
                item.targetPersona,
                item.tags,
                item.textContent,
            );

            const embedding = await generateEmbedding(embeddingInput);
            const embeddingStr = embeddingToSql(embedding);

            await prisma.$executeRaw`
                UPDATE "Content"
                SET "embedding" = ${embeddingStr}::vector
                WHERE id = ${item.id}
            `;

            console.log(`[${item.id}] "${item.displayName}"`);
            success++;
        } catch (err) {
            console.error(`[${item.id}] "${item.displayName}" — error:`, err);
            failed++;
        }
    }

    console.log(`\n--- Backfill complete ---`);
    console.log(`Success: ${success}`);
    console.log(`Failed:  ${failed}`);

    await prisma.$disconnect();
}

backfillEmbeddings();