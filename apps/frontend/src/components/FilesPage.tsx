import React, {useEffect, useState} from "react";
import DocViewer, {DocViewerRenderers} from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {
    FileText,
    FileSpreadsheet,
    Presentation,
    File,
    Bookmark,
    BookmarkCheck,
    ChevronDown,
    ChevronRight,
    Loader2,
    AlertCircle,
    FolderOpen,
} from "lucide-react";

// Supabase stuff, need to talk to backend to get properly setup
// const SUPABASE_URL = import.meta.env.SUPABASE_URL as string;
// const SUPABASE_SECRET_KEY = import.meta.env.SUPABASE_SECRET_KEY as string;
// const BUCKET_NAME = "test";

// const supabase

// file types are linked into one supported type
type SupportedType = "pdf" | "docx" | "pptx" | "xlsx";

// file metadata
interface FileItem {
    id: string;
    name: string;
    fileType: SupportedType | "other"; //other is anything currently unsupported, mostly so it doesn't break the site
    size?: number;
    updatedAt: string | null | undefined;
    publicUrl: string;
}

// supported types as of rn
const SUPPORTED_TYPES: Record<string, SupportedType> = {
    pdf: "pdf",
    docx: "docx",
    pptx: "pptx",
    xlsx: "xlsx",
};

// HELPER FUNCTIONS //
function getFileType(name: string): SupportedType | "other" {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return SUPPORTED_TYPES[ext] ?? "other";
}

//just formats how we display file size
function formatBytes(bytes?: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

//not used rn cause im still not sure if im using the toLocaleDateString function correctly
/*
function formatDate(iso?: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
} */

// Labels that get displayed to the user
const TYPE_LABELS: Record<string, string> = {
    pdf: "PDF",
    docx: "Word Document",
    pptx: "PowerPoint",
    xlsx: "Excel Spreadsheet",
    other: "File",
};

// sets the file icon, we can probably find some svg's but for now I have it edit colors
function FileIcon({type, className = ""}: { type: string; className?: string }) {
    const base = `shrink-0 ${className}`;
    if (type === "pdf") return <FileText className={`${base} text-red-500`}/>;
    if (type === "xlsx") return <FileSpreadsheet className={`${base} text-emerald-600`}/>;
    if (type === "pptx") return <Presentation className={`${base} text-orange-500`}/>;
    if (type === "docx") return <FileText className={`${base} text-blue-500`}/>;
    return <File className={`${base} text-muted-foreground`}/>;
}

// what gets showed to users for file types
function TypeBadge({type}: { type: string }) {
    const colors: Record<string, string> = {
        pdf: "bg-red-100 text-red-700",
        xlsx: "bg-emerald-100 text-emerald-700",
        pptx: "bg-orange-100 text-orange-700",
        docx: "bg-blue-100 text-blue-700",
        other: "bg-secondary text-secondary-foreground",
    };
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[type] ?? colors.other}`}
        >
            {TYPE_LABELS[type] ?? "File"}
        </span>
    );
}

// MAIN FUNCTION //
function FilesPage() {
    //tracking states
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // for expanding rows when inline viewing
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // not actually hooked up to the backend or finished rn but this will let people bookmark files in the future
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

    // Supabase file fetching (NEED HELP FROM BACKEND TO CHECK)
    useEffect(() => {
        async function fetchFiles() {
            setLoading(true);
            setError(null);
            try {
                // Fetch from your backend API instead of Supabase directly
                const response = await fetch('/api/files'); // Adjust the endpoint to match your backend route
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                const items: FileItem[] = data.map((file: FileItem) => ({
                    id: file.id,
                    name: file.name,
                    fileType: getFileType(file.name),
                    size: file.size,
                    updatedAt: file.updatedAt,
                    publicUrl: file.publicUrl,
                }));

                setFiles(items);
            } catch (err: unknown) {
                console.error('Fetch error:', err);
                setError(err instanceof Error ? err.message : "Failed to load files.");
            } finally {
                setLoading(false);
            }
        }

        fetchFiles();
    }, []);

    function toggleExpand(id: string) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    // add/remove bookmarks, the mouse event is so it doesn't expand the row when clicking the button
    function toggleBookmark(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setBookmarks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    // loading and error screens
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                <p className="text-sm">Loading files…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-destructive">
                <AlertCircle className="w-8 h-8"/>
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    // if no files found
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <FolderOpen className="w-10 h-10"/>
                <p className="text-sm">No files found in this bucket.</p>
            </div>
        );
    }

    // file renderer, if you wanna add anything just check the npm page for @iamjariwala/react-doc-viewer, very well put together
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
                    Documents
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {files.length} file{files.length !== 1 ? "s" : ""} in bucket
                </p>
            </div>

            {/* column header */}
            <div
                className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none">
                <span className="w-5"/> {/* icon */}
                <span>Name</span>
                <span className="hidden sm:block w-28 text-right">Type</span>
                <span className="hidden md:block w-20 text-right">Size</span>
                <span className="w-8"/> {/* bookmark */}
            </div>

            {/* file list */}
            <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
                {files.map((file, idx) => {
                    const isExpanded = expandedId === file.id;
                    const isBookmarked = bookmarks.has(file.id);
                    const canPreview = file.fileType !== "other";

                    return (
                        <div key={file.id}>
                            {}
                            {idx !== 0 && <div className="h-px bg-border mx-3"/>}

                            {/* file rows */}
                            <div
                                className={`
                                    grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4
                                    px-3 py-3
                                    transition-colors duration-150
                                    ${canPreview ? "cursor-pointer hover:bg-muted/60" : ""}
                                    ${isExpanded ? "bg-muted/40" : ""}
                                `}
                                onClick={() => canPreview && toggleExpand(file.id)}
                                role={canPreview ? "button" : undefined}
                                aria-expanded={canPreview ? isExpanded : undefined}
                                tabIndex={canPreview ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (canPreview && (e.key === "Enter" || e.key === " ")) {
                                        e.preventDefault();
                                        toggleExpand(file.id);
                                    }
                                }}
                            >
                                {/* file type icons */}
                                <FileIcon type={file.fileType} className="w-5 h-5"/>

                                {/* file names + expand */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate text-sm font-medium text-foreground">
                                        {file.name}
                                    </span>
                                    {canPreview && (
                                        <span className="text-muted-foreground shrink-0">
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4"/>
                                                : <ChevronRight className="w-4 h-4"/>}
                                        </span>
                                    )}
                                </div>

                                {/* file badge */}
                                <div className="hidden sm:flex justify-end w-28">
                                    <TypeBadge type={file.fileType}/>
                                </div>

                                {/* file size */}
                                <div className="hidden md:block w-20 text-right text-xs text-muted-foreground">
                                    {formatBytes(file.size)}
                                </div>

                                {/* bookmark button */}
                                <button
                                    className={`
                                        w-8 h-8 flex items-center justify-center rounded-md
                                        transition-colors
                                        ${isBookmarked
                                        ? "text-primary hover:text-primary/70"
                                        : "text-muted-foreground hover:text-foreground"
                                    }
                                    `}
                                    onClick={(e) => toggleBookmark(file.id, e)}
                                    aria-label={isBookmarked ? "Remove bookmark" : "Bookmark file"}
                                    title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-4 h-4"/>
                                        : <Bookmark className="w-4 h-4"/>}
                                </button>
                            </div>

                            {/* inline viewer, mostly just done through the library */}
                            {isExpanded && canPreview && (
                                <div className="border-t border-border bg-background">
                                    <DocViewer
                                        documents={[{uri: file.publicUrl, fileType: file.fileType}]}
                                        pluginRenderers={DocViewerRenderers}
                                        style={{minHeight: 520}}
                                        config={{
                                            header: {disableHeader: true},
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* bookmarks list */}
            {bookmarks.size > 0 && (
                <div
                    className="mt-4 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{bookmarks.size}</span>{" "}
                    file{bookmarks.size !== 1 ? "s" : ""} bookmarked
                </div>
            )}
        </div>
    );
}

export default FilesPage;