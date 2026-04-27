import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../apps/backend/.env') });

import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { extractText, SupportedMimeType } from '../../../apps/backend/lib/extractors';
import mime from 'mime-types';

async function backfill() {
    console.log('Fetching all content records...');

    const allContent = await prisma.content.findMany({
        where: { textContent: null }, // only process records not yet extracted
    });

    console.log(`Found ${allContent.length} records to process.\n`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of allContent) {
        try {
            let textContent: string | null = null;

            if (item.fileURI) {
                // Download file from Supabase
                const { data, error } = await supabase.storage
                    .from('content')
                    .download(item.fileURI);

                if (error || !data) {
                    console.warn(`Skipped [${item.id}] "${item.displayName}" — download failed:`, error?.message);
                    skipped++;
                    continue;
                }

                const buffer = Buffer.from(await data.arrayBuffer());

                // Infer MIME type from file path
                const mimeType = mime.lookup(item.fileURI) || null;
                if (!mimeType) {
                    console.warn(`Skipped [${item.id}] "${item.displayName}" — unknown MIME type`);
                    skipped++;
                    continue;
                }

                textContent = await extractText(buffer, mimeType as SupportedMimeType);

            } else if (item.linkURL) {
                textContent = await extractText(null, 'url', item.linkURL);
            } else {
                console.warn(`Skipped [${item.id}] "${item.displayName}" — no fileURI or linkURL`);
                skipped++;
                continue;
            }

            await prisma.content.update({
                where: { id: item.id },
                data: { textContent },
            });

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