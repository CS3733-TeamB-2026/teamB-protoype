import * as q from "@softeng-app/db";
import mime from "mime-types";
import * as cheerio from 'cheerio';
import dns from "node:dns/promises";
import {req, res} from "./types"

/** Returns true if the IPv4/IPv6 address is a loopback, private, or link-local address. */
function isPrivateIP(ip: string): boolean {
    const v4 = [
        /^127\./,                          // 127.0.0.0/8  loopback
        /^10\./,                           // 10.0.0.0/8   RFC-1918
        /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12 RFC-1918
        /^192\.168\./,                     // 192.168.0.0/16 RFC-1918
        /^169\.254\./,                     // 169.254.0.0/16 link-local / AWS metadata
        /^0\./,                            // 0.0.0.0/8
    ];
    if (v4.some(r => r.test(ip))) return true;
    // IPv6 loopback, link-local (fe80::/10), unique-local (fc00::/7)
    if (ip === "::1") return true;
    if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
    return false;
}

/**
 * Validates that a URL is safe to fetch as a server-side proxy:
 * - scheme must be http or https
 * - all DNS-resolved addresses must be public (blocks SSRF)
 */
async function assertPublicUrl(rawUrl: string): Promise<void> {
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch { throw new Error("Invalid URL"); }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only http/https URLs are allowed");
    }
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    for (const { address } of addresses) {
        if (isPrivateIP(address)) throw new Error("URL resolves to a private/internal address");
    }
}

const PREVIEW_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const previewContent = async (req: req, res: res) => {
    try {
        const url = req.query.url as string;
        if (!url) return res.status(400).json({ message: "Missing url parameter" });
        try {
            await assertPublicUrl(url);
        } catch (e: any) {
            return res.status(400).json({ message: e.message });
        }
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > PREVIEW_MAX_BYTES) {
            return res.status(400).json({ message: "Response too large" });
        }
        const html = new TextDecoder().decode(buffer);
        const $ = cheerio.load(html);
        const base = new URL(url);
        const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr("content") ?? null;
        const meta = (name: string) => $(`meta[name="${name}"]`).attr("content") ?? null;
        const resolve = (href: string | null) => {
            if (!href) return null;
            try { return new URL(href, base.origin).href; } catch { return null; }
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
        const favicon = resolve(rawFavicon) ?? `https://www.google.com/s2/favicons?domain=${base.hostname}&sz=32`;
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

export const getAllTags = async (req: req, res: res) => {
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
        const id = parseInt(req.params.id)
        const publicUrl = await q.Bucket.createPublicUrl(id)
        if (!publicUrl) return res.status(404).end();
        return res.status(200).json(publicUrl);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}

function buildFileURI(ownerID: string, filename: string): string {
    return `${ownerID}/${crypto.randomUUID()}/${filename}`;
}

export const uploadFile = async (req: req, res: res) => {
    const payload = req.body;
    let fileURI: string | null = null;
    let uploaded = false;
    try {
        if (req.file) {
            fileURI = buildFileURI(payload.ownerID, req.file.originalname);
            const uploadResult = await q.Bucket.uploadFile(req.file.buffer, fileURI);
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
        );
        return res.status(201).json(result);
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
        const oldContent = await q.Content.queryContentById(parseInt(payload.id));
        const oldURI: string | null = oldContent?.fileURI ?? null;
        if (req.file) {
            newFileURI = buildFileURI(payload.ownerID, req.file.originalname);
            const uploadResult = await q.Bucket.uploadFile(req.file.buffer, newFileURI);
            uploaded = true;
            newFileURI = uploadResult.path;
        }
        const linkURL = payload.linkURL || null;
        const fileURIForUpdate = uploaded ? newFileURI : (linkURL ? null : oldURI);
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
            parseInt(payload.employeeID),
        );
        if (oldURI && (uploaded || linkURL)) {
            await q.Bucket.deleteFile(oldURI).catch(console.error);
        }
        return res.status(201).json(result);
    } catch (error) {
        if (uploaded && newFileURI) {
            await q.Bucket.deleteFile(newFileURI).catch(console.error);
        }
        console.error(error);
        // updateContent throws "You do not have this content checked out."
        // when the caller's employeeID doesn't match the row's checkedOutById.
        // This happens after a force check-in, a lock expiry, or a check-in from another tab.
        if (error instanceof Error && error.message === "You do not have this content checked out.") {
            return res.status(409).json({ lockReleased: true, message: "This item has been forcibly checked in." });
        }
        return res.status(500).end();
    }
};

export const deleteContent = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        const employeeID = req.query.employeeID ? parseInt(req.query.employeeID as string) : null;
        if (!content) {
            return res.status(404).json({ message: "File not found" });
        }
        if (content.checkedOutById === null || content.checkedOutById !== employeeID) {
            return res.status(409).json({ lockReleased: true, message: "This item has been forcibly checked in." });
        }
        if (content.fileURI) {
            await q.Bucket.deleteFile(content.fileURI)
        }
        await q.Content.deleteContent(id);
        return res.status(205).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const checkoutContent = async (req: req, res: res) => {
    try {

        const {id, employeeID} = req.body;
        const result = await q.Content.checkoutContent(parseInt(id), parseInt(employeeID));

        return res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
}

export const checkinContent = async (req: req, res: res) => {
    try {
        const { id, employeeID } = req.body;
        await q.Content.checkinContent(parseInt(id), parseInt(employeeID));
        return res.status(200).json({ message: "Checked in" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
}

export const getTotalHitCount = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id)
        const count = await q.Content.getTotalHitCount(id)
        return res.status(200).json(count);
    }
    catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
}

export const getEmployeeHitCount = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id)
        const employeeId = parseInt(req.body.employeeId)
        const count = await q.Content.getEmployeeHitCount(id, employeeId)
        return res.status(200).json(count);
    }
    catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
}

/*
    I'm not making the hook for EmployeeGroupHitCount to avoid clutter if it won't be used,
    but I (Luke) can make it if it will be used for something like showing hit count by persona
*/

export const addHit = async (req: req, res: res) => {
    try {
        //get the employeeId of the logged-in user
        const auth0Id = req.auth?.payload.sub;
        const data = await q.Employee.queryEmployeeByAuth(auth0Id);
        if (!data) { return res.status(400).end() }
        const employeeId = data.id

        const id = parseInt(req.params.id)
        await q.Content.addHit(id, employeeId)
        return res.status(201).end();
    }
    catch (error: any) {
        console.error(error);
        return res.status(500).end();
    }
}
