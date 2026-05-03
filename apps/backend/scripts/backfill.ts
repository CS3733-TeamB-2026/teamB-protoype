import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../apps/backend/.env') });

import { prisma } from '@softeng-app/db';
import { supabase } from '@softeng-app/db';
import { extractText, SupportedMimeType } from '../lib/extractors';
import { generateEmbedding, embeddingToSql } from '../lib/embeddings';
import mime from 'mime-types';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

function buildEmbeddingInput(
    name: string,
    contentType: string,
    persona: string,
    tags: string[],
    textContent: string | null
): string {
    return [name, contentType, persona, tags.join(' '), textContent ?? ''].join(' ');
}

async function backfill() {
    const force = process.argv.includes('--force');
    console.log(force
        ? 'Fetching ALL content records to re-embed (--force)...'
        : 'Fetching all content records missing text or embeddings...');

    const allContent = force
    ? await prisma.$queryRaw<any[]>`
        SELECT
            id,
            "displayName",
            "fileURI",
            "linkURL",
            "contentType",
            "targetPersona",
            "tags",
            "textContent",
            "searchVector"::text,
            "embedding"::text
        FROM "Content"`
    : await prisma.$queryRaw<any[]>`
        SELECT
            id,
            "displayName",
            "fileURI",
            "linkURL",
            "contentType",
            "targetPersona",
            "tags",
            "textContent",
            "searchVector"::text,
            "embedding"::text
        FROM "Content"
        WHERE "textContent" IS NULL OR "embedding" IS NULL
    `;

    console.log(`Found ${allContent.length} records to process.\n`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of allContent) {
        try {
            let textContent: string | null = item.textContent;

            // --- Text extraction (skip if already have it) ---
            if (!textContent) {
                if (item.fileURI) {
                    const { data, error } = await supabase.storage
                        .from('content')
                        .download(item.fileURI);

                    if (error || !data) {
                        console.warn(`Skipped [${item.id}] "${item.displayName}" — download failed:`, error?.message);
                        skipped++;
                        continue;
                    }

                    const buffer = Buffer.from(await data.arrayBuffer());
                    const mimeType = mime.lookup(item.fileURI) || null;

                    if (!mimeType) {
                        console.warn(`Skipped [${item.id}] "${item.displayName}" — unknown MIME type`);
                        skipped++;
                        continue;
                    }

                    // Images and PDFs go through OCR-aware extraction
                    textContent = await extractText(buffer, mimeType as SupportedMimeType);

                } else if (item.linkURL) {
                    textContent = await extractText(null, 'url', item.linkURL);
                } else {
                    console.warn(`Skipped [${item.id}] "${item.displayName}" — no fileURI or linkURL`);
                    skipped++;
                    continue;
                }

                // Save text content
                await prisma.content.update({
                    where: { id: item.id },
                    data: { textContent },
                });
            }

            // --- Embedding generation ---
            const embeddingInput = buildEmbeddingInput(
                item.displayName,
                item.contentType,
                item.targetPersona,
                item.tags ?? [], // fallback to empty array if null
                textContent,
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
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed:  ${failed}`);

    await prisma.$disconnect();
}

backfill();