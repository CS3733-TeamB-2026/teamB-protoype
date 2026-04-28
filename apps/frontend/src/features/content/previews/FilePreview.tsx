import { memo, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import * as XLSX from "xlsx";
import DocViewer, { PDFRenderer, DocxRenderer, MarkdownRenderer } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { getPreviewMode } from "@/lib/mime.ts";
import { getCachedText, setCachedText, getCachedBlob, setCachedBlob } from "@/features/content/previews/file-cache.ts";
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
 *  - `"microsoft"` → Word/Excel/PowerPoint via Office 365 iframe viewer
 *  - `"docviewer"` → PDF/Markdown via react-doc-viewer ({@link DocViewerMemo})
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
    // Derive the renderer once — this is pure (no async work) and drives both
    // initial state and the fetch logic below.
    const previewMode = getPreviewMode(null, filename);

    const [fileSize, setFileSize] = useState<number | null>(null);
    // "none" files have nothing to fetch, so we can skip straight to "ready".
    const [status, setStatus] = useState<FetchStatus>(previewMode === "none" ? "ready" : "loading");
    const [content, setContent] = useState<string | null>(null);   // text mode
    const [objectUrl, setObjectUrl] = useState<string | null>(null); // blob-backed renderers
    const [tableData, setTableData] = useState<string[][] | null>(null); // table mode
    const [publicUrl, setPublicUrl] = useState<string | null>(null) // microsoft office mode
    const { getAccessTokenSilently } = useAuth0();
    // Keep a ref so the fetch effect never needs getAccessTokenSilently as a dep.
    // Auth0 returns a new function reference on every render, which would otherwise
    // cause the effect to re-run, revoking and recreating blob URLs unnecessarily.
    const getTokenRef = useRef(getAccessTokenSilently);

    const hitCountLastTime = useRef(0) //use dummy value to make sure the first hit goes through
    const hitCountLastEmployee = useRef(0)

    useEffect(() => { getTokenRef.current = getAccessTokenSilently; });

    // Triggers a real browser download by creating a temporary <a> element with
    // the "download" attribute and clicking it programmatically. The object URL
    // is immediately revoked after the click — the browser queues the download
    // before the URL is invalidated.
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

    const getPublicUrl = async (contentId: string) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/content/publicUrl/${contentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPublicUrl(data);
    }

    // Main fetch effect. Runs whenever the file source, preview mode, or info
    // URL changes (i.e. when a different file is expanded).
    useEffect(() => {
        // localUrl is tracked in a local variable (not just state) so the cleanup
        // function can revoke it even if the component unmounts before setObjectUrl
        // is called.
        let localUrl: string | null = null;

        const run = async () => {
            try {
                const token = await getTokenRef.current();

                //get the contentId by grabbing the end of the infoSrc url - used for microsoft and hit count
                const contentId = infoSrc?.split("/").at(-1) ?? null;
                if (!contentId) { return }

                // Fetch file size metadata independently of the file content so
                // the size can be shown even for "none" preview files.
                if (infoSrc) {
                    const res = await fetch(infoSrc, { headers: { Authorization: `Bearer ${token}` } });
                    const meta = await res.json();
                    setFileSize(meta?.size ?? null);
                }

                if (previewMode === "none") return;

                if (previewMode === "text") {
                    // Text files are stored as strings — no object URL needed.
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
                    // SheetJS needs an ArrayBuffer, but we cache the raw Blob so
                    // the same bytes can be reused without re-fetching.
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
                    // Parse just the first sheet and convert to a 2-D string array.
                    // header:1 means "use row indices as headers" (i.e. return raw rows),
                    // defval:"" fills empty cells with an empty string instead of undefined.

                    const wb = XLSX.read(buf, { type: "array" });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
                    setTableData(rows as string[][]);
                    setStatus("ready");

                } else {
                    // All remaining modes (image, video, audio, html, docviewer)
                    // need an object URL pointing at the raw blob.
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

                    //microsoft documents need this in addition to blob url
                    if (previewMode === "microsoft") {
                        await getPublicUrl(contentId);
                    }

                    //Adding to hit count
                    //Prevent the hit count from being updated twice
                    const res2 = await fetch("/api/employee/me", {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        }
                    })
                    const myId = (await res2.json()).id

                    //Only allow new hit from same employee if more than 30 seconds since last request
                    if(myId != hitCountLastEmployee.current || Date.now() - hitCountLastTime.current > 30000) {
                        hitCountLastTime.current = Date.now()
                        hitCountLastEmployee.current = myId

                        //Add to the hit count
                        await fetch(`/api/preview/hits/${contentId}`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    }
                    else {
                        //still update the request time and employee to prevent adding new hits every reload (or every other reload)
                        hitCountLastTime.current = Date.now()
                        hitCountLastEmployee.current = myId
                    }

                    setStatus("ready");
                }
            } catch {
                setStatus("error");
            }
        };

        void run();

        // Cleanup: revoke the object URL when the component unmounts or when
        // the effect re-runs for a new file, preventing memory leaks.
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
            {/* Always-visible header row: filename, file size (if known), download link */}
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

            {/* Loading / error states — shown while the fetch effect is running */}
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

            {/* Renderer selection — exactly one of these will match once status is "ready" */}

            {/* No renderer available for this file type (archives, legacy Office, etc.) */}
            {status === "ready" && previewMode === "none" && (
                <p className="px-6 py-4 text-sm text-muted-foreground">No preview available for this file type.</p>
            )}
            {/* Plain text: rendered in a scrollable <pre> block */}
            {status === "ready" && previewMode === "text" && (
                <pre className="px-6 pb-4 text-sm text-foreground overflow-auto max-h-130 whitespace-pre-wrap">
                    {content}
                </pre>
            )}
            {/* Image: rendered with an <img> tag pointed at the object URL */}
            {status === "ready" && previewMode === "image" && objectUrl && (
                <div className="px-6 pb-4">
                    <img
                        src={objectUrl}
                        alt={filename}
                        className="mx-auto rounded object-contain"
                    />
                </div>
            )}
            {/* Word / Excel / PowerPoint: Office 365 iframe viewer */}
            {status === "ready" && previewMode === "microsoft" && publicUrl && (
                <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`}
                    className="w-full border-0"
                    style={{ minHeight: "600px" }}
                    title={filename}
                />
            )}
            {/* CSV: first row treated as column headers, remaining rows as data */}
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
            {/* Video / audio: native browser controls pointing at the object URL */}
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
            {/* HTML: sandboxed iframe — allow-same-origin lets relative asset paths
                resolve, but scripts are blocked so the file can't escape the sandbox */}
            {status === "ready" && previewMode === "html" && objectUrl && (
                <iframe
                    src={objectUrl}
                    sandbox="allow-same-origin"
                    className="w-full border-0"
                    style={{ minHeight: 520 }}
                    title={filename}
                />
            )}
            {/* PDF / DOCX / Markdown: delegated to DocViewerMemo (memoized to
                preserve page position across parent re-renders) */}
            {status === "ready" && previewMode === "docviewer" && objectUrl && (
                <DocViewerMemo objectUrl={objectUrl} filename={filename} mode={mode} />
            )}
        </div>
    );
}
