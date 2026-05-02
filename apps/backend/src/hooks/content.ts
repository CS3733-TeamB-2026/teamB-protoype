import * as q from "@softeng-app/db";
import mime from "mime-types";
import * as cheerio from "cheerio";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";
import { assertPublicUrl } from "../helpers/validateUrl";
import { isAdmin, isPersonaOrAdmin, isUserOrAdmin } from "../helpers/permissions";
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

        const oldContent = await q.Content.queryContentByIdWithVectors(
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
 * Soft-deletes a content item (moves it to the recycle bin).
 * Requires the caller to hold the checkout lock — same gate as updateContent.
 * Clears the checkout lock as part of the operation.
 * The Supabase file (if any) is NOT deleted here; that happens on permanent delete.
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
        await q.Content.softDeleteContent(id);
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Returns all deleted content visible to the caller: all items for admins, owned items only for everyone else. */
export const getDeletedContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const content = await q.Content.queryDeletedContent(employee.id, isAdmin(employee));
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/**
 * Restores a soft-deleted content item.
 * Requires the caller to be the item owner or an admin.
 */
export const restoreContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const id = parseInt(req.params.id);
        const content = await q.Content.queryDeletedContentById(id);
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        if (!isUserOrAdmin(content.ownerId ?? -1, employee)) {
            return res.status(403).json({ error: "Only the owner or an admin can restore this item." });
        }
        await q.Content.restoreContent(id);
        return res.status(200).json({ message: "Restored" });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/**
 * Permanently deletes a content item and its Supabase file.
 * Requires the caller to be the item owner or an admin.
 * The item must already be in the recycle bin (deleted = true).
 */
export const permanentDeleteContent = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee)
            return res.status(404).json({ error: "Employee not found" });

        const id = parseInt(req.params.id);
        const content = await q.Content.queryDeletedContentById(id);
        if (!content) {
            return res.status(404).json({ message: "Content not found in recycle bin." });
        }
        if (!isUserOrAdmin(content.ownerId ?? -1, employee)) {
            return res.status(403).json({ error: "Only the owner or an admin can permanently delete this item." });
        }
        if (content.fileURI) {
            await q.Bucket.deleteFile(content.fileURI);
        }
        await q.Content.permanentDeleteContent(id);
        return res.status(200).json(content);
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

export const getTransactionSummary = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const isAdminUser = isAdmin(employee);

        // Get all content visible to user
        const allContent = await q.Content.queryAllContent();
        const visibleContent = isAdminUser
            ? allContent
            : allContent.filter(c => c.targetPersona === employee.persona);

        // Aggregate hits by owner
        const hitsByOwner: Record<number, {
            firstName: string;
            lastName: string;
            persona: string;
            totalHits: number;
            contentCount: number;
        }> = {};

        for (const content of visibleContent) {
            if (!content.ownerId) continue;

            const hitCount = await q.Preview.queryHits(content.id)

            if (!hitsByOwner[content.ownerId]) {
                const owner = await q.Employee.queryEmployeeById(content.ownerId);
                if (owner) {
                    hitsByOwner[content.ownerId] = {
                        firstName: owner.firstName,
                        lastName: owner.lastName,
                        persona: owner.persona,
                        totalHits: hitCount,
                        contentCount: 1,
                    };
                }
            } else {
                hitsByOwner[content.ownerId].totalHits += hitCount;
                hitsByOwner[content.ownerId].contentCount += 1;
            }
        }

        // Aggregate hits by persona
        const hitsByPersona: Record<string, number> = {};
        for (const content of visibleContent) {
            const hitCount = await q.Preview.queryHits(content.id);
            hitsByPersona[content.targetPersona] =
                (hitsByPersona[content.targetPersona] ?? 0) + hitCount;
        }

        // Content currency (last modified) by owner
        const contentCurrency: Array<{
            ownerId: number;
            ownerName: string;
            ownerPersona: string;
            totalContent: number;
            avgAge: number;
            mostRecentUpdate: string;
            oldestUpdate: string;
        }> = [];

        const ownerGroups = new Map<number, any[]>();
        for (const content of visibleContent) {
            if (!content.ownerId) continue;
            if (!ownerGroups.has(content.ownerId)) {
                ownerGroups.set(content.ownerId, []);
            }
            ownerGroups.get(content.ownerId)!.push(content);
        }

        const now = Date.now();
        for (const [ownerId, contents] of ownerGroups) {
            const owner = await q.Employee.queryEmployeeById(ownerId);
            if (!owner) continue;

            const lastModifiedDates = contents.map(c => c.lastModified.getTime());
            const avgAge = Math.round(
                (now - (lastModifiedDates.reduce((a, b) => a + b, 0) / lastModifiedDates.length)) /
                (1000 * 60 * 60 * 24)
            );

            contentCurrency.push({
                ownerId,
                ownerName: `${owner.firstName} ${owner.lastName}`,
                ownerPersona: owner.persona,
                totalContent: contents.length,
                avgAge,
                mostRecentUpdate: new Date(Math.max(...lastModifiedDates)).toISOString(),
                oldestUpdate: new Date(Math.min(...lastModifiedDates)).toISOString(),
            });
        }

        // Expiration status (check tags from autoTag job)
        const expirationCounts = {
            expired: 0,
            'expiring-soon': 0,
            ok: 0,
        };

        for (const content of visibleContent) {
            if (content.tags.includes('Expired')) {
                expirationCounts.expired++;
            } else if (content.tags.includes('Expiring Soon')) {
                expirationCounts['expiring-soon']++;
            } else {
                expirationCounts.ok++;
            }
        }

        return res.status(200).json({
            summary: {
                totalContent: visibleContent.length,
                totalHits: Object.values(hitsByPersona).reduce((a, b) => a + b, 0),
                uniqueOwners: Object.keys(hitsByOwner).length,
            },
            hitsByOwner: Object.entries(hitsByOwner)
                .map(([id, data]) => ({ ownerId: parseInt(id), ...data }))
                .sort((a, b) => b.totalHits - a.totalHits),
            hitsByPersona,
            contentCurrency: contentCurrency.sort((a, b) => a.avgAge - b.avgAge),
            expirationStatus: expirationCounts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};