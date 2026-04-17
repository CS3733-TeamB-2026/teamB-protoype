import {
    File,
    FileArchive,
    FileAudio,
    FileCode2,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Link,
} from "lucide-react";
import { type Category, CATEGORY_COLORS } from "@/lib/mime.ts";

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
        case "pdf":
            return <FileText className={cls} />;
        case "document":
            return <FileText className={cls} />;
        case "spreadsheet":
            return <FileSpreadsheet className={cls} />;
        case "image":
            return <FileImage className={cls} />;
        case "audio":
            return <FileAudio className={cls} />;
        case "video":
            return <FileVideo className={cls} />;
        case "archive":
            return <FileArchive className={cls} />;
        case "code":
            return <FileCode2 className={cls} />;
        default:
            return <File className={cls} />;
    }
}
