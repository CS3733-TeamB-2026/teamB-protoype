import pdfParse from 'pdf-parse-fork';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';

export type SupportedMimeType =
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'text/plain'
    | 'text/csv'
    | 'text/html'
    | 'url';

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

            case 'text/plain':
            case 'text/csv': {
                if (!fileBuffer) return null;
                return fileBuffer.toString('utf-8');
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