import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../apps/backend/.env') });

import { generateEmbedding } from '../lib/embeddings';

const embedding = await generateEmbedding('quarterly financial report underwriter');
console.log('Dimensions:', embedding.length);
console.log('Sample values:', embedding.slice(0, 5));
