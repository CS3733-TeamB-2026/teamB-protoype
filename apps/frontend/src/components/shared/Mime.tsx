import {
    File,
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileText,
    FileVideo,
    Link,
} from "lucide-react";

export function getOriginalFilename(fileURI: string): string {
    return fileURI.split("/").pop() ?? fileURI;
}

// Category determines icon choice
export type Category =
    | "document"
    | "image"
    | "video"
    | "audio"
    | "code"
    | "archive"
    | "other";

export function getCategory(mimeType: string | null): Category {
    if (!mimeType) return "other";
    if (mimeType === "application/pdf") return "document";
    if (mimeType.includes("word") || mimeType.includes("opendocument.text"))
        return "document";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
        return "document";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
        return "document";
    if (
        mimeType === "text/plain" ||
        mimeType === "text/markdown" ||
        mimeType === "text/csv"
    )
        return "document";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("text/")) return "code";
    if (
        mimeType.includes("zip") ||
        mimeType.includes("tar") ||
        mimeType.includes("rar") ||
        mimeType.includes("7z") ||
        mimeType.includes("gzip")
    )
        return "archive";
    return "other";
}

// Color is driven by category
const CATEGORY_COLORS: Record<
    Category | "link",
    { badge: string; icon: string }
> = {
    document: { badge: "bg-blue-100 text-blue-700", icon: "text-blue-500" },
    image: { badge: "bg-pink-100 text-pink-700", icon: "text-pink-500" },
    video: { badge: "bg-purple-100 text-purple-700", icon: "text-purple-500" },
    audio: { badge: "bg-amber-100 text-amber-700", icon: "text-amber-500" },
    code: { badge: "bg-cyan-100 text-cyan-700", icon: "text-cyan-500" },
    archive: { badge: "bg-stone-100 text-stone-700", icon: "text-stone-500" },
    other: {
        badge: "bg-secondary text-secondary-foreground",
        icon: "text-muted-foreground",
    },
    link: { badge: "bg-violet-100 text-violet-700", icon: "text-violet-500" },
};

export function getExtension(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext ?? "unknown";
}

export function ContentIcon({
    category,
    isLink,
    className = "",
}: {
    category: Category;
    isLink: boolean;
    className?: string;
}) {
    const colors = CATEGORY_COLORS[isLink ? "link" : category];
    const cls = `shrink-0 ${className} ${colors.icon}`;
    if (isLink) return <Link className={cls} />;
    switch (category) {
        case "document":
            return <FileText className={cls} />;
        case "image":
            return <FileImage className={cls} />;
        case "video":
            return <FileVideo className={cls} />;
        case "audio":
            return <FileAudio className={cls} />;
        case "code":
            return <FileCode className={cls} />;
        case "archive":
            return <FileArchive className={cls} />;
        default:
            return <File className={cls} />;
    }
}

export function ExtBadge({
    category,
    ext,
    isLink,
}: {
    category: Category;
    ext: string | null;
    isLink: boolean;
}) {
    const colors = CATEGORY_COLORS[isLink ? "link" : category];
    const label = isLink ? "Link" : (ext ?? "unknown").toUpperCase();
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors.badge}`}
        >
            {label}
        </span>
    );
}