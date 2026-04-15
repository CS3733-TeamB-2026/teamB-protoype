import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import ReactMarkdown from "react-markdown";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { getPreviewMode } from "@/lib/mime.ts";
import { getCachedText, setCachedText, getCachedBlob, setCachedBlob } from "@/lib/file-cache.ts";
import { useAuth0 } from "@auth0/auth0-react"

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
    filename: string;
    src: string;
    infoSrc?: string;
}

type FetchStatus = "loading" | "ready" | "error";

export function FilePreview({ filename, src, infoSrc }: Props) {
    const previewMode = getPreviewMode(null, filename);

    const [fileSize, setFileSize] = useState<number | null>(null);
    const [status, setStatus] = useState<FetchStatus>(previewMode === "none" ? "ready" : "loading");
    const [content, setContent] = useState<string | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [tableData, setTableData] = useState<string[][] | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const { getAccessTokenSilently } = useAuth0();

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
                const token = await getAccessTokenSilently();

                if (infoSrc) {
                    const res = await fetch(infoSrc, { headers: { Authorization: `Bearer ${token}` } });
                    const meta = await res.json();
                    setFileSize(meta?.size ?? null);
                }

                if (previewMode === "none") return;

                if (previewMode === "text" || previewMode === "markdown") {
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
            if (localUrl) URL.revokeObjectURL(localUrl);
        };
    }, [infoSrc, previewMode, src, getAccessTokenSilently]);

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
                <p className="px-6 py-4 text-sm text-destructive">Failed to load preview.</p>
            )}
            {status === "ready" && previewMode === "none" && (
                <p className="px-6 py-4 text-sm text-muted-foreground">No preview available for this file type.</p>
            )}
            {status === "ready" && previewMode === "text" && (
                <pre className="px-6 pb-4 text-sm text-foreground overflow-auto max-h-130 whitespace-pre-wrap">
                    {content}
                </pre>
            )}
            {status === "ready" && previewMode === "markdown" && (
                <div className="px-6 pb-4 text-left prose prose-sm max-w-none">
                    <ReactMarkdown>{content ?? ""}</ReactMarkdown>
                </div>
            )}
            {status === "ready" && previewMode === "image" && objectUrl && (
                <div className="px-6 pb-4">
                    <img
                        src={objectUrl}
                        alt={filename}
                        className="max-h-64 mx-auto rounded cursor-zoom-in object-contain"
                        onClick={() => setLightboxOpen(true)}
                    />
                    <Lightbox
                        open={lightboxOpen}
                        close={() => setLightboxOpen(false)}
                        slides={[{ src: objectUrl, alt: filename }]}
                        plugins={[Zoom, Fullscreen]}
                    />
                </div>
            )}
            {status === "ready" && previewMode === "table" && tableData != null && (
                <div className="overflow-x-auto max-h-130 px-6 pb-4">
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
            {status === "ready" && previewMode === "docviewer" && objectUrl && (
                <DocViewer
                    documents={[{ uri: objectUrl, fileName: filename }]}
                    pluginRenderers={DocViewerRenderers}
                    style={{ minHeight: 520 }}
                    config={{ header: { disableHeader: true } }}
                />
            )}
        </div>
    );
}
