/**
 * Single source of truth for file types this app supports.
 *
 * Philosophy: instead of trying to classify every possible MIME type, we keep
 * an explicit allowlist. Every entry on this list is known to have:
 *   - a working preview mode in FilesPage,
 *   - a category with an icon and color,
 *   - acceptable browser support for upload.
 *
 * Files whose type isn't on the allowlist are rejected at upload time, so
 * the viewer never has to deal with an unknown type. To add support for a
 * new file type:
 *   1. Add an entry to ALLOWED_TYPES below.
 *   2. Make sure its `category` has an icon/color in CATEGORY_COLORS.
 *   3. Make sure its `previewMode` has a working renderer in FilePreview.
 */

/** Visual grouping for a file — drives the icon and color shown in the list. */
export type Category =
    | "pdf"
    | "document"
    | "spreadsheet"
    | "presentation"
    | "image"
    | "audio"
    | "video"
    | "archive"
    | "code"
    | "other"
    | "link";

/**
 * Which renderer {@link FilePreview} should use for a file.
 * - `"docviewer"`  — PDF / Markdown via react-doc-viewer
 * - `"microsoft"`  — Word / Excel / PowerPoint via Office 365 iframe viewer
 * - `"image"`      — `<img>` tag
 * - `"audio"`      — `<audio>` element
 * - `"video"`      — `<video>` element
 * - `"text"`       — `<pre>` block (plain text, code, etc.)
 * - `"table"`      — HTML table parsed from CSV via SheetJS
 * - `"html"`       — sandboxed `<iframe>`
 * - `"none"`       — no preview, download-only
 */
export type PreviewMode = "docviewer" | "microsoft" | "image" | "audio" | "video" | "text" | "table" | "html" | "none";

export interface AllowedType {
    /** Canonical MIME type. Lowercase. */
    mimeType: string;
    /** File extensions (lowercase, no dot) that map to this type. */
    extensions: readonly string[];
    /** Drives icon and color in the file list. */
    category: Category;
    /** Drives which renderer FilesPage uses in the expanded row. */
    previewMode: PreviewMode;
    /** Human-readable label, used in validation error messages. */
    label: string;
}

export const ALLOWED_TYPES: readonly AllowedType[] = [
    // --- PDFs and office documents (rendered with DocViewer) ---
    {
        mimeType: "application/pdf",
        extensions: ["pdf"],
        category: "pdf",
        previewMode: "docviewer",
        label: "PDF",
    },
    {
        mimeType: "application/msword",
        extensions: ["doc"],
        category: "document",
        previewMode: "microsoft",
        label: "Word (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extensions: ["docx"],
        category: "document",
        previewMode: "microsoft",
        label: "Word",
    },
    {
        mimeType: "application/vnd.ms-excel",
        extensions: ["xls"],
        category: "spreadsheet",
        previewMode: "microsoft",
        label: "Excel (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extensions: ["xlsx"],
        category: "spreadsheet",
        previewMode: "microsoft",
        label: "Excel",
    },
    {
        mimeType: "application/vnd.ms-powerpoint",
        extensions: ["ppt"],
        category: "presentation",
        previewMode: "microsoft",
        label: "PowerPoint (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extensions: ["pptx"],
        category: "presentation",
        previewMode: "microsoft",
        label: "PowerPoint",
    },
    {
        mimeType: "text/markdown",
        extensions: ["md", "markdown"],
        category: "document",
        previewMode: "docviewer",
        label: "Markdown",
    },

    // --- Plain text (rendered with a <pre> block) ---
    {
        mimeType: "text/plain",
        extensions: ["txt"],
        category: "document",
        previewMode: "text",
        label: "Text",
    },
    {
        mimeType: "text/csv",
        extensions: ["csv"],
        category: "spreadsheet",
        previewMode: "table",
        label: "CSV",
    },

    // --- Video ---
    {
        mimeType: "video/mp4",
        extensions: ["mp4"],
        category: "video",
        previewMode: "video",
        label: "MP4",
    },
    {
        mimeType: "video/webm",
        extensions: ["webm"],
        category: "video",
        previewMode: "video",
        label: "WebM Video",
    },

    // --- Audio ---
    {
        mimeType: "audio/mpeg",
        extensions: ["mp3"],
        category: "audio",
        previewMode: "audio",
        label: "MP3",
    },
    {
        mimeType: "audio/wav",
        extensions: ["wav"],
        category: "audio",
        previewMode: "audio",
        label: "WAV",
    },
    {
        mimeType: "audio/ogg",
        extensions: ["ogg", "oga"],
        category: "audio",
        previewMode: "audio",
        label: "OGG Audio",
    },
    {
        mimeType: "audio/mp4",
        extensions: ["m4a"],
        category: "audio",
        previewMode: "audio",
        label: "M4A",
    },
    {
        mimeType: "audio/aac",
        extensions: ["aac"],
        category: "audio",
        previewMode: "audio",
        label: "AAC",
    },
    {
        mimeType: "audio/flac",
        extensions: ["flac"],
        category: "audio",
        previewMode: "audio",
        label: "FLAC",
    },

    // --- HTML (sandboxed iframe preview) ---
    {
        mimeType: "text/html",
        extensions: ["html", "htm"],
        category: "code",
        previewMode: "html",
        label: "HTML",
    },

    // --- Archives (no preview, download only) ---
    {
        mimeType: "application/zip",
        extensions: ["zip"],
        category: "archive",
        previewMode: "none",
        label: "ZIP",
    },

    // --- Images (rendered with an <img> tag) ---
    {
        mimeType: "image/png",
        extensions: ["png"],
        category: "image",
        previewMode: "image",
        label: "PNG",
    },
    {
        mimeType: "image/jpeg",
        extensions: ["jpg", "jpeg"],
        category: "image",
        previewMode: "image",
        label: "JPEG",
    },
    {
        mimeType: "image/gif",
        extensions: ["gif"],
        category: "image",
        previewMode: "image",
        label: "GIF",
    },
    {
        mimeType: "image/webp",
        extensions: ["webp"],
        category: "image",
        previewMode: "image",
        label: "WebP",
    },
    {
        mimeType: "image/svg+xml",
        extensions: ["svg"],
        category: "image",
        previewMode: "image",
        label: "SVG",
    },
];

// ---------- Derived lookups (built once at module load) ----------

const BY_MIMETYPE: ReadonlyMap<string, AllowedType> = new Map(
    ALLOWED_TYPES.map((t) => [t.mimeType.toLowerCase(), t]),
);

const BY_EXTENSION: ReadonlyMap<string, AllowedType> = new Map(
    ALLOWED_TYPES.flatMap((t) =>
        t.extensions.map((ext) => [ext.toLowerCase(), t] as const),
    ),
);

// ---------- Public lookups ----------

/** Returns the AllowedType matching a MIME string, or null if not on the allowlist. */
export function lookupByMimeType(
    mimeType: string | null | undefined,
): AllowedType | null {
    if (!mimeType) return null;
    return BY_MIMETYPE.get(mimeType.toLowerCase()) ?? null;
}

/** Returns the AllowedType matching a filename's extension, or null. */
export function lookupByFilename(
    filename: string | null | undefined,
): AllowedType | null {
    if (!filename) return null;
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return null;
    return BY_EXTENSION.get(ext) ?? null;
}

/**
 * Resolve an AllowedType from whatever info we have. Tries the MIME type first
 * (most authoritative), falls back to the filename extension (useful when
 * loading existing content from the DB where only the filename is stored).
 */
export function resolveAllowedType(
    mimeType: string | null | undefined,
    filename?: string | null,
): AllowedType | null {
    return lookupByMimeType(mimeType) ?? lookupByFilename(filename);
}

/** Category for display. Unknown types fall back to "other". */
export function getCategory(
    mimeType: string | null | undefined,
    filename?: string | null,
): Category {
    return resolveAllowedType(mimeType, filename)?.category ?? "other";
}

/** Preview mode for FilesPage. Unknown types → "none". */
export function getPreviewMode(
    mimeType: string | null | undefined,
    filename?: string | null,
): PreviewMode {
    return resolveAllowedType(mimeType, filename)?.previewMode ?? "none";
}

// ---------- File URI utilities ----------

/** Extracts the original filename from a storage URI (last path segment). */
export function getOriginalFilename(fileURI: string): string {
    return fileURI.split("/").pop() ?? fileURI;
}

/** Returns the lowercased extension of a filename (without the dot). */
export function getExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() ?? "unknown";
}

/** Returns the filename with its extension removed. */
export function stripExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

// ---------- Colors ----------

export const CATEGORY_COLORS: Record<Category, { badge: string; icon: string }> = {
    pdf:          { badge: "bg-red-100 text-red-700",         icon: "text-red-500" },
    document:     { badge: "bg-blue-100 text-blue-700",      icon: "text-blue-500" },
    spreadsheet:  { badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-500" },
    presentation: { badge: "bg-orange-100 text-orange-700",  icon: "text-orange-500" },
    image:        { badge: "bg-pink-100 text-pink-700",   icon: "text-pink-500" },
    audio:        { badge: "bg-teal-100 text-teal-700",    icon: "text-teal-500" },
    video:        { badge: "bg-indigo-100 text-indigo-700", icon: "text-indigo-500" },
    archive:      { badge: "bg-yellow-100 text-yellow-700", icon: "text-yellow-500" },
    code:         { badge: "bg-orange-100 text-orange-700", icon: "text-orange-500" },
    other:        { badge: "bg-secondary text-secondary-foreground", icon: "text-muted-foreground" },
    link:         { badge: "bg-violet-100 text-violet-700", icon: "text-violet-500" },
};

// ---------- Upload validation ----------

export type UploadValidation =
    | { ok: true; mimeType: string; entry: AllowedType }
    | { ok: false; reason: string };

export const MAX_FILE_SIZE_MB = 50;

/**
 * Validate a browser File against the allowlist and size limit. On success,
 * returns the canonical mimetype and the matched entry. On failure, returns a
 * human readable reason suitable for showing in the upload form.
 */
export function validateFileForUpload(file: File): UploadValidation {
    const entry = resolveAllowedType(file.type, file.name);
    if (!entry) {
        return {
            ok: false,
            reason: `"${file.name}" is not a supported file type.`,
        };
    }

    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return {
            ok: false,
            reason: `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please select a smaller file.`,
        };
    }

    // Prefer the browser-reported mimetype when present; some browsers return
    // an empty string for less common types, in which case we fall back to the
    // allowlist entry's canonical value.
    const mimeType = file.type || entry.mimeType;
    return { ok: true, mimeType, entry };
}

/**
 * Value for the HTML `<input type="file" accept="...">` attribute. Lists every
 * allowed MIME type AND every allowed extension, so the browser file picker
 * filters correctly across platforms (some OS file pickers only understand
 * one or the other).
 */
export const ALLOWED_ACCEPT_STRING: string = [
    ...ALLOWED_TYPES.map((t) => t.mimeType),
    ...ALLOWED_TYPES.flatMap((t) => t.extensions.map((ext) => `.${ext}`)),
].join(",");

/** Comma-separated list of user-facing labels, for error/help messages. */
export const ALLOWED_TYPES_LABEL: string = ALLOWED_TYPES.map(
    (t) => t.label,
).join(", ");
