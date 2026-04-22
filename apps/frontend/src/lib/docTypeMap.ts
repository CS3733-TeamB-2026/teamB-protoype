import type { DocType } from "@/lib/types"

export function mapExtensionToDocType(ext: string | null): DocType | null {
    if (!ext) return null
    const lower = ext.toLowerCase()

    if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(lower))
        return "office"

    if (["txt", "csv"].includes(lower))
        return "plain text"

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(lower))
        return "images"

    if (["mp3", "wav", "aac", "flac", "m4a", "ogg", "oga"].includes(lower))
        return "audio"

    if (["mp4", "webm"].includes(lower))
        return "video"

    if (["zip"].includes(lower))
        return "zip"

    if (["html", "htm"].includes(lower))
        return "html"

    return null
}