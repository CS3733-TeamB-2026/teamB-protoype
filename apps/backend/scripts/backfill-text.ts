/**
 * Backfills textContent for all content items that don't have it yet.
 * Run this before backfill.ts if you want a separate text-extraction pass.
 *
 * Usage:
 *   pnpm --filter backend exec tsx scripts/backfill-text.ts [--force]
 *
 * --force  Re-extract text for rows that already have textContent
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

import type { SupportedMimeType } from '../lib/extractors.js';
const { prisma, supabase } = await import('@softeng-app/db');
const { extractText } = await import('../lib/extractors.js');
const mime = (await import('mime-types')).default;

const force = process.argv.includes('--force');

async function backfill() {
    const rows = await prisma.content.findMany({ where: force ? {} : { textContent: null } });
    console.log(`Found ${rows.length} records to process (force=${force}).\n`);

    let success = 0, skipped = 0, failed = 0;

    for (const item of rows) {
        try {
            let textContent: string | null = null;

            if (item.fileURI) {
                const { data, error } = await supabase.storage.from('content').download(item.fileURI);
                if (error || !data) {
                    console.warn(`Skipped [${item.id}] "${item.displayName}" — download failed:`, error?.message);
                    skipped++; continue;
                }
                const mimeType = mime.lookup(item.fileURI) || null;
                if (!mimeType) {
                    console.warn(`Skipped [${item.id}] "${item.displayName}" — unknown MIME type`);
                    skipped++; continue;
                }
                textContent = await extractText(Buffer.from(await data.arrayBuffer()), mimeType as SupportedMimeType);
            } else if (item.linkURL) {
                textContent = await extractText(null, 'url', item.linkURL);
            } else {
                console.warn(`Skipped [${item.id}] "${item.displayName}" — no fileURI or linkURL`);
                skipped++; continue;
            }

            await prisma.content.update({ where: { id: item.id }, data: { textContent } });
            console.log(`[${item.id}] "${item.displayName}"`);
            success++;
        } catch (err) {
            console.error(`[${item.id}] "${item.displayName}" — error:`, err);
            failed++;
        }
    }

    console.log(`\nSuccess: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
    await prisma.$disconnect();
}

void backfill();
