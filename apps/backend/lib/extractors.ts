import pdfParse from 'pdf-parse-fork';
const officeParser = await import('officeparser');
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';

export type SupportedMimeType =
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    | 'text/plain'
    | 'text/csv'
    | 'text/markdown'
    | 'text/x-markdown'
    | 'text/html'
    | 'url';

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
                const pdf = await pdfParse(fileBuffer);
                return pdf.text;
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
                    const response = await axios.get<string>(url, { timeout: 10000 });
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

            default:
                return null;
        }
    } catch (err) {
        console.error(`[extractText] Failed to extract text for type "${fileType}":`, err);
        return null;
    }
}