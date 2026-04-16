import { memo, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import * as XLSX from "xlsx";
import DocViewer, { PDFRenderer, DocxRenderer, MarkdownRenderer } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { getPreviewMode } from "@/lib/mime.ts";
import { getCachedText, setCachedText, getCachedBlob, setCachedBlob } from "@/lib/file-cache.ts";
import { useAuth0 } from "@auth0/auth0-react"

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Controls how much vertical space the preview occupies.
 * - `"inline"` — compact preview inside an expanded table row (ViewContent)
 * - `"full"`   — full-page viewer used in ViewSingleFile
 */
type DisplayMode = "inline" | "full";

interface Props {
    /** Original filename including extension (e.g. `"report.pdf"`). Used to
     *  determine the preview mode and as the suggested download filename. */
    filename: string;
    /** Authenticated API URL to fetch the file content, e.g.
     *  `"/api/content/download/5"`. Also used as the cache key. */
    src: string;
    /** Optional API URL to fetch file metadata (currently just `size`), e.g.
     *  `"/api/content/info/5"`. When omitted the file size is not shown. */
    infoSrc?: string;
    /** Display density. Defaults to `"inline"`. */
    mode?: DisplayMode;
}

/** Tracks whether the file fetch is in progress, done, or failed. */
type FetchStatus = "loading" | "ready" | "error";

/**
 * Thin wrapper around `@iamjariwala/react-doc-viewer` that is memoized by its
 * `objectUrl` and `filename` props.
 *
 * DocViewer resets its internal page number whenever it re-renders, so without
 * memoization the user's scroll/page position would be lost every time the
 * parent (ViewContent) re-renders — for example when the 15-second polling
 * interval fires.
 */
const DocViewerMemo = memo(function DocViewerMemo({
    objectUrl, filename, mode,
}: {
    objectUrl: string;
    filename: string;
    mode: DisplayMode;
}) {
    return (
        <DocViewer
            documents={[{ uri: objectUrl, fileName: filename }]}
            pluginRenderers={[PDFRenderer, DocxRenderer, MarkdownRenderer]}
            config={{
                header: { disableHeader: true },
                pdfVerticalScrollByDefault: mode === "full",
            }}
        />
    );
});

/**
 * Renders a file preview panel with a download button.
 *
 * The preview format is chosen automatically by `getPreviewMode` based on the
 * filename extension:
 *  - `"text"`      → `<pre>` block (plain text, code, etc.)
 *  - `"image"`     → `<img>` tag
 *  - `"table"`     → HTML table parsed from an Excel/CSV file via SheetJS
 *  - `"video"`     → `<video>` element
 *  - `"audio"`     → `<audio>` element
 *  - `"html"`      → sandboxed `<iframe>`
 *  - `"docviewer"` → PDF/DOCX/Markdown via react-doc-viewer ({@link DocViewerMemo})
 *  - `"none"`      → "No preview available" message
 *
 * Binary formats (everything except `"text"`) are fetched as a `Blob` and
 * converted to an object URL for display. Both text and blob results are stored
 * in the module-level caches in `lib/file-cache.ts` so navigating away and
 * back doesn't trigger a second network request.
 *
 * The object URL is created when the effect runs and revoked in the cleanup
 * function to avoid memory leaks.
 */
export function FilePreview({ filename, src, infoSrc, mode = "inline" }: Props) {
    const previewMode = getPreviewMode(null, filename);

    const [fileSize, setFileSize] = useState<number | null>(null);
    const [status, setStatus] = useState<FetchStatus>(previewMode === "none" ? "ready" : "loading");
    const [content, setContent] = useState<string | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [tableData, setTableData] = useState<string[][] | null>(null);
    const { getAccessTokenSilently } = useAuth0();
    // Keep a ref so the fetch effect never needs getAccessTokenSilently as a dep.
    // Auth0 returns a new function reference on every render, which would otherwise
    // cause the effect to re-run, revoking and recreating blob URLs unnecessarily.
    const getTokenRef = useRef(getAccessTokenSilently);
    useEffect(() => { getTokenRef.current = getAccessTokenSilently; });

    const handleDownload = async () => {
        const token = await getAccessTokenSilently();
        const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        let localUrl: string | null = null;

        const run = async () => {
            try {
                const token = await getTokenRef.current();

                if (infoSrc) {
                    const res = await fetch(infoSrc, { headers: { Authorization: `Bearer ${token}` } });
                    const meta = await res.json();
                    setFileSize(meta?.size ?? null);
                }

                if (previewMode === "none") return;

                if (previewMode === "text") {
                    const cachedText = getCachedText(src);
                    if (cachedText !== undefined) {
                        setContent(cachedText);
                        setStatus("ready");
                        return;
                    }
                    const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) { setStatus("error"); return; }
                    const text = await res.text();
                    setCachedText(src, text);
                    setContent(text);
                    setStatus("ready");

                } else if (previewMode === "table") {
                    const cachedBlob = getCachedBlob(src);
                    let buf: ArrayBuffer;
                    if (cachedBlob) {
                        buf = await cachedBlob.arrayBuffer();
                    } else {
                        const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } });
                        if (!res.ok) { setStatus("error"); return; }
                        const blob = await res.blob();
                        setCachedBlob(src, blob);
                        buf = await blob.arrayBuffer();
                    }
                    const wb = XLSX.read(buf, { type: "array" });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
                    setTableData(rows as string[][]);
                    setStatus("ready");

                } else {
                    const cachedBlob = getCachedBlob(src);
                    let blob: Blob;
                    if (cachedBlob) {
                        blob = cachedBlob;
                    } else {
                        const res = await fetch(src, { headers: { Authorization: `Bearer ${token}` } });
                        if (!res.ok) { setStatus("error"); return; }
                        blob = await res.blob();
                        setCachedBlob(src, blob);
                    }
                    localUrl = URL.createObjectURL(blob);
                    setObjectUrl(localUrl);
                    setStatus("ready");
                }
            } catch {
                setStatus("error");
            }
        };

        void run();

        return () => {
            if (localUrl) {
                URL.revokeObjectURL(localUrl);
                setObjectUrl(null);
                setStatus("loading");
            }
        };
    }, [infoSrc, previewMode, src]);

    return (
        <div className="bg-background overflow-hidden">
            {/* Header: filename, size, download */}
            <div className="px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{filename}</span>
                {fileSize != null && (
                    <span className="text-xs text-muted-foreground">{formatBytes(fileSize)}</span>
                )}
                <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <Download className="w-4 h-4" /> Download
                </button>
            </div>

            {status === "loading" && (
                <div className="flex items-center gap-2 px-6 py-4 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                </div>
            )}
            {status === "error" && (
                <Alert variant="destructive" className="mx-6 my-4">
                    <AlertCircle />
                    <AlertDescription>Failed to load preview.</AlertDescription>
                </Alert>
            )}
            {status === "ready" && previewMode === "none" && (
                <p className="px-6 py-4 text-sm text-muted-foreground">No preview available for this file type.</p>
            )}
            {status === "ready" && previewMode === "text" && (
                <pre className="px-6 pb-4 text-sm text-foreground overflow-auto max-h-130 whitespace-pre-wrap">
                    {content}
                </pre>
            )}
            {status === "ready" && previewMode === "image" && objectUrl && (
                <div className="px-6 pb-4">
                    <img
                        src={objectUrl}
                        alt={filename}
                        className="mx-auto rounded object-contain"
                    />
                </div>
            )}
            {status === "ready" && previewMode === "table" && tableData != null && (
                <div className="overflow-auto max-h-130 px-6 pb-4">
                    <table className="text-sm border-collapse">
                        <thead>
                            <tr>
                                {(tableData[0] ?? []).map((cell, i) => (
                                    <th key={i} className="border border-border px-3 py-1.5 bg-muted text-left font-medium whitespace-nowrap">
                                        {cell}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.slice(1).map((row, ri) => (
                                <tr key={ri} className="even:bg-muted/30">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="border border-border px-3 py-1.5 whitespace-nowrap">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {status === "ready" && previewMode === "video" && objectUrl && (
                <div className="px-6 pb-4">
                    <video controls className="w-full rounded" src={objectUrl} />
                </div>
            )}
            {status === "ready" && previewMode === "audio" && objectUrl && (
                <div className="px-6 pb-4">
                    <audio controls className="w-full" src={objectUrl} />
                </div>
            )}
            {status === "ready" && previewMode === "html" && objectUrl && (
                <iframe
                    src={objectUrl}
                    sandbox="allow-same-origin"
                    className="w-full border-0"
                    style={{ minHeight: 520 }}
                    title={filename}
                />
            )}
            {status === "ready" && previewMode === "docviewer" && objectUrl && (
                <DocViewerMemo objectUrl={objectUrl} filename={filename} mode={mode} />
            )}
        </div>
    );
}
