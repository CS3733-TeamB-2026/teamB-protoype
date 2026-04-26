import fs from 'fs';
import { extractText } from './lib/extractors';

// Test PDF
const pdfBuffer = fs.readFileSync('./The Good Life Exists Through Relationships.pdf');
const pdfText = await extractText(pdfBuffer, 'application/pdf');
console.log('PDF:', pdfText?.slice(0, 300));

// Test URL
const urlText = await extractText(null, 'url', 'https://example.com');
console.log('URL:', urlText?.slice(0, 300));