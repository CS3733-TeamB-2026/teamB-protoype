import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

const MAX_TEXT_LENGTH = 8000;
const OCR_VISION_THRESHOLD = 50; // chars below which we try the vision model
const IMAGE_DESCRIPTION_MODEL = 'gpt-5.4-nano';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
    if (_openai) return _openai;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    _openai = new OpenAI({ apiKey: key });
    return _openai;
}

let _visionDisabled = false;
let _visionTokensTotal = 0;

/** Total tokens consumed by vision API calls this process lifetime. */
export function getVisionTokensUsed(): number { return _visionTokensTotal; }

export type SupportedMimeType =
    | 'application/pdf'
    | 'application/msword'
    | 'application/vnd.ms-excel'
    | 'application/vnd.ms-powerpoint'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'text/plain'
    | 'text/csv'
    | 'text/markdown'
    | 'text/html'
    | 'url';

async function ocrImage(buffer: Buffer): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {},
    });
    const ocrText = text.trim();
    if (ocrText.length >= OCR_VISION_THRESHOLD) return ocrText;

    // OCR found little text — image is likely a diagram/photo, try vision model
    if (_visionDisabled) return ocrText;
    const client = getOpenAI();
    if (!client) return ocrText;

    try {
        // Normalize to PNG — OpenAI vision accepts JPEG/PNG/WebP/GIF, not raw buffers of arbitrary format
        const { default: sharp } = await import('sharp');
        const png = await sharp(buffer).png().toBuffer();
        const b64 = png.toString('base64');

        const response = await client.chat.completions.create({
            model: IMAGE_DESCRIPTION_MODEL,
            messages: [{
                role: 'user',
                content: [
                    { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}`, detail: 'low' } },
                    { type: 'text', text: 'Describe the content of this image concisely for search indexing. Focus on the information it contains, not its visual style.' },
                ],
            }],
            max_completion_tokens: 300,
        });

        const tokens = response.usage?.total_tokens ?? 0;
        _visionTokensTotal += tokens;
        console.log(`  [vision] ${tokens} tokens (running total: ${_visionTokensTotal})`);

        return response.choices[0]?.message?.content?.trim() ?? ocrText;
    } catch (err: any) {
        if (err?.code === 'missing_scope' || err?.status === 401) {
            _visionDisabled = true;
            console.warn(`  [vision] API key lacks model.request scope — skipping vision for remaining images`);
        } else {
            console.error(`  [vision] error:`, err?.message ?? err);
        }
        return ocrText;
    }
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

/** Extracts structured text from an XLSX workbook: sheet name + header row + data rows. */
function parseXlsx(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (rows.length === 0) return '';
        const lines = rows.map(row => row.map(String).join('\t')).join('\n');
        return `Sheet: ${name}\n${lines}`;
    }).filter(Boolean).join('\n\n');
}

// promisify officeParser (for .doc, .ppt, legacy formats)
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
        let result: string | null = null;

        switch (fileType) {
            case 'application/pdf': {
                if (!fileBuffer) break;
                result = await ocrPdf(fileBuffer);
                break;
            }

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                if (!fileBuffer) break;
                const docx = await mammoth.extractRawText({ buffer: fileBuffer });
                result = docx.value;
                break;
            }

            // Legacy Office formats — officeparser handles .doc / .xls / .ppt
            case 'application/msword':
            case 'application/vnd.ms-excel':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
                if (!fileBuffer) break;
                result = await parseOfficeFile(fileBuffer);
                break;
            }

            // Modern XLSX — SheetJS gives structured sheet/header/row output
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                if (!fileBuffer) break;
                result = parseXlsx(fileBuffer);
                break;
            }

            case 'text/plain':
            case 'text/csv': {
                if (!fileBuffer) break;
                result = fileBuffer.toString('utf-8');
                break;
            }

            case 'text/markdown': {
                if (!fileBuffer) break;
                result = stripMarkdown(fileBuffer.toString('utf-8'));
                break;
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
                    break;
                }
                const $ = cheerio.load(html);
                $('script, style, nav, header, footer, aside, head, [role="banner"], [role="navigation"], [role="complementary"]').remove();
                // Prefer semantic content elements; fall back to full body
                const main = $('main, article, [role="main"]').text().replace(/\s+/g, ' ').trim();
                result = main || $('body').text().replace(/\s+/g, ' ').trim();
                break;
            }

            case 'image/jpeg':
            case 'image/png':
            case 'image/webp': {
                if (!fileBuffer) break;
                result = await ocrImage(fileBuffer);
                break;
            }
        }

        if (result && result.length > MAX_TEXT_LENGTH) {
            result = result.slice(0, MAX_TEXT_LENGTH);
        }
        return result || null;
    } catch (err) {
        console.error(`[extractText] Failed to extract text for type "${fileType}":`, err);
        return null;
    }
}