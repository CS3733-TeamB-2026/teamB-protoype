import * as q from "@softeng-app/db";
import mime from "mime-types";
import * as cheerio from "cheerio";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";
import { assertPublicUrl } from "../helpers/validateUrl";
import { isAdmin, isPersonaOrAdmin } from "../helpers/permissions";
import { extractText, SupportedMimeType } from "../../lib/extractors";
import { generateEmbedding, embeddingToSql } from '../../lib/embeddings';
import { prisma } from '../../../../packages/db/lib/prisma';
import dns from "node:dns/promises";
import {applyExpirationTagsToOne} from "../jobs/autoTag"

const PREVIEW_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const previewContent = async (req: req, res: res) => {
    try {
        const url = req.query.url as string;
        if (!url)
            return res.status(400).json({ message: "Missing url parameter" });
        try {
            await assertPublicUrl(url);
        } catch (e: any) {
            return res.status(400).json({ message: e.message });
        }
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
        });
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > PREVIEW_MAX_BYTES) {
            return res.status(400).json({ message: "Response too large" });
        }
        const html = new TextDecoder().decode(buffer);
        const $ = cheerio.load(html);
        const base = new URL(url);
        const og = (prop: string) =>
            $(`meta[property="og:${prop}"]`).attr("content") ?? null;
        const meta = (name: string) =>
            $(`meta[name="${name}"]`).attr("content") ?? null;
        const resolve = (href: string | null) => {
            if (!href) return null;
            try {
                return new URL(href, base.origin).href;
            } catch {
                return null;
            }
        };
        // Try favicon sources in priority order: high-res first, then smaller, then Apple touch icon
        const rawFavicon =
            $('link[rel="icon"][sizes="32x32"]').attr("href") ??
            $('link[rel="icon"][sizes="16x16"]').attr("href") ??
            $('link[rel="icon"]').attr("href") ??
            $('link[rel="shortcut icon"]').attr("href") ??
            $('link[rel="apple-touch-icon"]').attr("href") ??
            null;
        // Fall back to Google's favicon service, which is highly reliable
        const favicon =
            resolve(rawFavicon) ??
            `https://www.google.com/s2/favicons?domain=${base.hostname}&sz=32`;
        return res.status(200).json({
            title: og("title") ?? $("title").text() ?? null,
            description: og("description") ?? meta("description") ?? null,
            image: resolve(og("image")),
            siteName: og("site_name") ?? null,
            favicon,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getAllContent = async (req: req, res: res) => {
    const persona = req.query.persona as string | null;
    try {
        const content = persona
            ? await q.Content.queryContentByPersona(persona)
            : await q.Content.queryAllContent();
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getAllTags = async (_req: req, res: res) => {
    try {
        const content = await q.Content.queryAllContent();
        const tags = [...new Set(content.flatMap((item) => item.tags ?? []))];
        return res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getContentById = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);

        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getContentInfo = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        if (!content || !content.fileURI) {
            return res.status(404).json({ message: "File not found" });
        }
        const metadata = await q.Bucket.getFileMetadata(content.fileURI);
        return res.status(200).json(metadata);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const downloadContent = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        if (!content || !content.fileURI) {
            return res.status(404).json({ message: "File not found" });
        }
        const blob = await q.Bucket.downloadFile(content.fileURI);
        const buffer = Buffer.from(await blob.arrayBuffer());
        const filename = content.fileURI.split("/").pop() ?? "download";
        const contentType = mime.lookup(filename) || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length);
        return res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getPublicFileUrl = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const publicUrl = await q.Bucket.createPublicUrl(id);
        if (!publicUrl) return res.status(404).end();
        return res.status(200).json(publicUrl);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

function buildFileURI(ownerID: string, filename: string): string {
    return `${ownerID}/${crypto.randomUUID()}/${filename}`;
}

export const uploadFile = async (req: req, res: res) => {
    const payload = req.body;
    let fileURI: string | null = null;
    let uploaded = false;
    let textContent: string | null = null;

    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        // ownerID comes from the body (not the JWT) so admins can upload content
        // on behalf of another employee. Caller existence is still verified above.
        if (req.file) {
            fileURI = buildFileURI(payload.ownerID, req.file.originalname);
            const uploadResult = await q.Bucket.uploadFile(
                req.file.buffer,
                fileURI,
            );
            uploaded = true;
            fileURI = uploadResult.path;
        }

        const result = await q.Content.createContent(
            payload.name,
            payload.linkURL || null,
            fileURI,
            payload.ownerID ? parseInt(payload.ownerID) : null,
            payload.contentType,
            payload.status,
            new Date(payload.lastModified),
            payload.expiration ? new Date(payload.expiration) : null,
            payload.targetPersona,
            JSON.parse(payload.tags || "[]"),
            null    // textContent filled in background
        );
        await applyExpirationTagsToOne(result.id);

        // Respond immediately
        res.status(201).json(result);

        // Process extraction + embedding in background
        const fileBuffer = req.file?.buffer ?? null;
        const mimeType = req.file?.mimetype ?? null;

        setImmediate(async () => {
            try {
                let textContent: string | null = null;

                if (fileBuffer && mimeType) {
                    textContent = await extractText(fileBuffer, mimeType as SupportedMimeType);
                } else if (payload.linkURL) {
                    textContent = await extractText(null, 'url', payload.linkURL);
                }

                const embeddingInput = [
                    payload.name,
                    payload.contentType,
                    payload.targetPersona,
                    JSON.parse(payload.tags || "[]").join(' '),
                    textContent ?? '',
                ].join(' ');

                const embedding = await generateEmbedding(embeddingInput);

                await prisma.$executeRaw`
                    UPDATE "Content"
                    SET
                        "textContent" = ${textContent},
                        "embedding" = ${embeddingToSql(embedding)}::vector
                    WHERE id = ${result.id}
                `;

                console.log(`[background] Processed content id=${result.id}`);
            } catch (err) {
                console.error(`[background] Failed to process content id=${result.id}:`, err);
            }
        });
    } catch (error) {
        if (uploaded && fileURI) {
            await q.Bucket.deleteFile(fileURI).catch(console.error);
        }
        console.error(error);
        return res.status(500).end();
    }
};

export const updateContent = async (req: req, res: res) => {
    const payload = req.body;
    let newFileURI: string | null = null;
    let uploaded = false;
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const oldContent = await q.Content.queryContentById(
            parseInt(payload.id),
        );
        const oldURI: string | null = oldContent?.fileURI ?? null;
        if (req.file) {
            newFileURI = buildFileURI(payload.ownerID, req.file.originalname);
            const uploadResult = await q.Bucket.uploadFile(
                req.file.buffer,
                newFileURI,
            );
            uploaded = true;
            newFileURI = uploadResult.path;
        }
        const linkURL = payload.linkURL || null;
        const fileURIForUpdate = uploaded
            ? newFileURI
            : linkURL
              ? null
              : oldURI;

        // Update metadata immediately, text/embedding filled in background
        const result = await q.Content.updateContent(
            parseInt(payload.id),
            payload.name,
            linkURL,
            fileURIForUpdate,
            payload.ownerID ? parseInt(payload.ownerID) : null,
            payload.contentType,
            payload.status,
            payload.lastModified ? new Date(payload.lastModified) : new Date(),
            payload.expiration ? new Date(payload.expiration) : null,
            payload.targetPersona,
            JSON.parse(payload.tags || "[]"),
            employee.id,
            null    // textContent filled in background
        );
        if (oldURI && (uploaded || linkURL)) {
            await q.Bucket.deleteFile(oldURI).catch(console.error);
        }
        await applyExpirationTagsToOne(result.id);

        // Respond immediately
        res.status(201).json(result);

        // Capture buffer before setImmediate since req may not be available later
        const fileBuffer = req.file?.buffer ?? null;
        const mimeType = req.file?.mimetype ?? null;

        setImmediate(async () => {
            try {
                let textContent: string | null = null;

                if (fileBuffer && mimeType) {
                    textContent = await extractText(fileBuffer, mimeType as SupportedMimeType);
                } else if (linkURL) {
                    textContent = await extractText(null, 'url', linkURL);
                } else if (oldContent?.textContent) {
                    // no new file or URL — keep existing text content
                    textContent = oldContent.textContent;
                }

                const embeddingInput = [
                    payload.name,
                    payload.contentType,
                    payload.targetPersona,
                    JSON.parse(payload.tags || "[]").join(' '),
                    textContent ?? '',
                ].join(' ');

                const embedding = await generateEmbedding(embeddingInput);

                await prisma.$executeRaw`
                    UPDATE "Content"
                    SET
                        "textContent" = ${textContent},
                        "embedding" = ${embeddingToSql(embedding)}::vector
                    WHERE id = ${result.id}
                `;

                console.log(`[background] Processed content id=${result.id}`);
            } catch (err) {
                console.error(`[background] Failed to process content id=${result.id}:`, err);
            }
        });
    } catch (error) {
        if (uploaded && newFileURI) {
            await q.Bucket.deleteFile(newFileURI).catch(console.error);
        }
        console.error(error);
        // updateContent throws "You do not have this content checked out."
        // when the caller's employeeID doesn't match the row's checkedOutById.
        // This happens after a force check-in, a lock expiry, or a check-in from another tab.
        if (
            error instanceof Error &&
            error.message === "You do not have this content checked out."
        ) {
            return res
                .status(409)
                .json({
                    lockReleased: true,
                    message: "This item has been forcibly checked in.",
                });
        }
        return res.status(500).end();
    }
};

/**
 * Deletes a content item and its Supabase file (if any).
 * Requires the caller to hold the checkout lock — same gate as updateContent.
 * Returns 409 both when the item is not checked out and when someone else holds it,
 * so the frontend can display a consistent "lock required" message in both cases.
 */
export const deleteContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        if (!content) {
            return res.status(404).json({ message: "File not found" });
        }
        if (
            content.checkedOutById === null ||
            content.checkedOutById !== employee.id
        ) {
            return res
                .status(409)
                .json({
                    lockReleased: true,
                    message: "This item has been forcibly checked in.",
                });
        }
        if (content.fileURI) {
            await q.Bucket.deleteFile(content.fileURI);
        }
        await q.Content.deleteContent(id);
        return res.status(205).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/**
 * Acquires a pessimistic edit lock on a content item.
 * Requires two DB reads: one to verify persona access, one inside the query class to
 * detect an existing lock. 403 if the caller's persona doesn't match targetPersona.
 */
export const checkoutContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const contentId = parseInt(req.params.id);

        const content = await q.Content.queryContentById(contentId);
        if (!content) return res.status(404).json({ error: "Content not found" });

        // Only employees whose persona matches the content's targetPersona (or admins) may check out
        if (!isPersonaOrAdmin(content.targetPersona, employee)) {
            return res.status(403).json({ error: "Your persona does not have access to this content" });
        }

        const result = await q.Content.checkoutContent(contentId, employee.id);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
};

/**
 * Releases the edit lock on a content item.
 * Non-admins must hold the lock themselves; admins can force-checkin any item.
 * The admin path skips the ownership DB read since no check is needed.
 */
export const checkinContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const contentId = parseInt(req.params.id);

        // Admins can force check-in any item; non-admins can only check in their own lock
        if (!isAdmin(employee)) {
            const content = await q.Content.queryContentById(contentId);
            if (content?.checkedOutById !== employee.id) {
                return res
                    .status(403)
                    .json({ error: "You do not have this item checked out." });
            }
        }

        await q.Content.checkinContent(contentId, employee.id);
        return res.status(200).json({ message: "Checked in" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
};

export const searchContent = async (req: req, res: res) => {
    const { q: searchQuery } = req.query;
    if (!searchQuery || typeof searchQuery !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
    }
    try {
        const results = await q.Content.semanticSearch(searchQuery);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};
