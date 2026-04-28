import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';


export type SupportedMimeType =
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'image/tiff'
    | 'text/plain'
    | 'text/csv'
    | 'text/markdown'
    | 'text/x-markdown'
    | 'text/html'
    | 'url';

async function ocrImage(buffer: Buffer): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {}, // suppress progress logs
    });
    return text.trim();
}

async function ocrPdf(buffer: Buffer): Promise<string> {
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // First try native text extraction
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ')
            .trim();

        if (pageText.length > 50) {
            // Page has real text, no need for OCR
            textParts.push(pageText);
        } else {
            // Page is likely scanned, render to canvas and OCR
            const viewport = page.getViewport({ scale: 2.0 });
            const { createCanvas } = await import('canvas');
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({
                canvasContext: context as any,
                viewport,
                canvas: canvas as any,
            }).promise;

            const imageBuffer = canvas.toBuffer('image/png');
            const ocrText = await ocrImage(imageBuffer);
            if (ocrText) textParts.push(ocrText);
        }
    }

    return textParts.join('\n').trim();
}

// promisify officeParser
async function parseOfficeFile(buffer: Buffer): Promise<string> {
    const { parseOffice } = await import('officeparser');
    return new Promise((resolve, reject) => {
        try {
            parseOffice(buffer, (ast, err) => {
                if (err) reject(err);
                else resolve(ast?.toText() ?? '');
            });
        } catch (err) {
            reject(err);
        }
    });
}

// strip markdown syntax, keep plain text
function stripMarkdown(content: string): string {
    return content
        .replace(/#{1,6}\s+/g, '')           // headings
        .replace(/(\*\*|__)(.*?)\1/g, '$2')  // bold
        .replace(/(\*|_)(.*?)\1/g, '$2')     // italic
        .replace(/`{1,3}[^`]*`{1,3}/g, '')   // code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')  // images
        .replace(/^[-*+]\s+/gm, '')          // list items
        .replace(/^\d+\.\s+/gm, '')          // numbered lists
        .replace(/^>\s+/gm, '')              // blockquotes
        .replace(/[-]{3,}/g, '')             // horizontal rules
        .replace(/\s+/g, ' ')
        .trim();
}

export async function extractText(
    fileBuffer: Buffer | null,
    fileType: SupportedMimeType,
    url?: string
): Promise<string | null> {
    try {
        switch (fileType) {
            case 'application/pdf': {
                if (!fileBuffer) return null;
                return await ocrPdf(fileBuffer);
            }

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                if (!fileBuffer) return null;
                const docx = await mammoth.extractRawText({ buffer: fileBuffer });
                return docx.value;
            }

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
                if (!fileBuffer) return null;
                return await parseOfficeFile(fileBuffer);
            }

            case 'text/plain':
            case 'text/csv': {
                if (!fileBuffer) return null;
                return fileBuffer.toString('utf-8');
            }

            case 'text/markdown':
            case 'text/x-markdown': {
                if (!fileBuffer) return null;
                return stripMarkdown(fileBuffer.toString('utf-8'));
            }

            case 'text/html':
            case 'url': {
                let html: string;
                if (url) {
                    const response = await axios.get<string>(url, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        },
                    });
                    html = response.data;
                } else if (fileBuffer) {
                    html = fileBuffer.toString('utf-8');
                } else {
                    return null;
                }
                const $ = cheerio.load(html);
                $('script, style, nav, footer, head').remove();
                return $('body').text().replace(/\s+/g, ' ').trim();
            }

            case 'image/jpeg':
            case 'image/png':
            case 'image/webp':
            case 'image/tiff': {
                if (!fileBuffer) return null;
                return await ocrImage(fileBuffer);
            }

            default:
                return null;
        }
    } catch (err) {
        console.error(`[extractText] Failed to extract text for type "${fileType}":`, err);
        return null;
    }
}