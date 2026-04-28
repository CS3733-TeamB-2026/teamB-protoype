import { generateEmbedding } from '../lib/embeddings';

const embedding = await generateEmbedding('quarterly financial report underwriter');
console.log('Dimensions:', embedding.length);       // should be 384
console.log('Sample values:', embedding.slice(0, 5)); // should be small floats