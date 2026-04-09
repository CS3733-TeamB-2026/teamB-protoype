// Single source of truth for file types this app supports.
//
// Philosophy: instead of trying to classify every possible MIME type, we keep
// an explicit allowlist. Every entry on this list is known to have:
//   - a working preview mode in FilesPage,
//   - a category with an icon and color,
//   - acceptable browser support for upload.
//
// Files whose type isn't on the allowlist are rejected at upload time, so
// the viewer never has to deal with an unknown type. To add support for a
// new file type:
//   1. Add an entry to ALLOWED_TYPES below.
//   2. Make sure its `category` has an icon/color in FilesPage's CATEGORY_COLORS.
//   3. Make sure its `previewMode` has a working renderer in FilesPage.

export type Category =
    | "pdf"
    | "document"
    | "spreadsheet"
    | "image"
    | "video"
    | "audio"
    | "code"
    | "archive"
    | "other";

export type PreviewMode = "docviewer" | "image" | "text" | "markdown" | "table" | "none";

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
        previewMode: "none",
        label: "Word (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extensions: ["docx"],
        category: "document",
        previewMode: "docviewer",
        label: "Word",
    },
    {
        mimeType: "application/vnd.ms-excel",
        extensions: ["xls"],
        category: "spreadsheet",
        previewMode: "table",
        label: "Excel (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extensions: ["xlsx"],
        category: "spreadsheet",
        previewMode: "table",
        label: "Excel",
    },
    {
        mimeType: "application/vnd.ms-powerpoint",
        extensions: ["ppt"],
        category: "other",
        previewMode: "none",
        label: "PowerPoint (legacy)",
    },
    {
        mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extensions: ["pptx"],
        category: "other",
        previewMode: "none",
        label: "PowerPoint",
    },
    {
        mimeType: "text/markdown",
        extensions: ["md", "markdown"],
        category: "document",
        previewMode: "markdown",
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

    // --- Archives (no preview, download only) ---
    {
        mimeType: "application/zip",
        extensions: ["zip"],
        category: "archive",
        previewMode: "none",
        label: "ZIP",
    },
    {
        mimeType: "application/x-tar",
        extensions: ["tar"],
        category: "archive",
        previewMode: "none",
        label: "TAR",
    },
    {
        mimeType: "application/gzip",
        extensions: ["gz", "tgz"],
        category: "archive",
        previewMode: "none",
        label: "GZIP",
    },
    {
        mimeType: "application/x-bzip2",
        extensions: ["bz2"],
        category: "archive",
        previewMode: "none",
        label: "BZIP2",
    },
    {
        mimeType: "application/x-7z-compressed",
        extensions: ["7z"],
        category: "archive",
        previewMode: "none",
        label: "7-Zip",
    },
    {
        mimeType: "application/vnd.rar",
        extensions: ["rar"],
        category: "archive",
        previewMode: "none",
        label: "RAR",
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

// ---------- Colors ----------

export const CATEGORY_COLORS: Record<
    Category | "link",
    { badge: string; icon: string }
> = {
    pdf:          { badge: "bg-red-100 text-red-700",         icon: "text-red-500" },
    document:     { badge: "bg-blue-100 text-blue-700",      icon: "text-blue-500" },
    spreadsheet:  { badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-500" },

    image:    { badge: "bg-pink-100 text-pink-700",   icon: "text-pink-500" },
    video:    { badge: "bg-purple-100 text-purple-700", icon: "text-purple-500" },
    audio:    { badge: "bg-amber-100 text-amber-700", icon: "text-amber-500" },
    code:     { badge: "bg-cyan-100 text-cyan-700",   icon: "text-cyan-500" },
    archive:  { badge: "bg-yellow-100 text-yellow-700", icon: "text-yellow-500" },
    other:    { badge: "bg-secondary text-secondary-foreground", icon: "text-muted-foreground" },
    link:     { badge: "bg-violet-100 text-violet-700", icon: "text-violet-500" },
};

// ---------- Upload validation ----------

export type UploadValidation =
    | { ok: true; mimeType: string; entry: AllowedType }
    | { ok: false; reason: string };

/**
 * Validate a browser File against the allowlist. On success, returns the
 * canonical mimetype and the matched entry. On failure, returns a human
 * readable reason suitable for showing in the upload form.
 */
export function validateFileForUpload(file: File): UploadValidation {
    const entry = resolveAllowedType(file.type, file.name);
    if (!entry) {
        return {
            ok: false,
            reason: `"${file.name}" is not a supported file type.`,
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
