import type { ContentItem } from "@/pages/ViewContent.tsx";

export type ContentFormValues = {
    name: string;
    linkUrl: string;
    ownerID: number;
    contentType: "reference" | "workflow" | "";
    status: "new" | "inProgress" | "complete";
    jobPosition: string;
    uploadMode: "url" | "file";
    file: File | null;
    dateModified: Date | undefined;
    lastModifiedTime: string;
    dateExpiration: Date | undefined;
};

export function nowTimeString(): string {
    return new Date().toTimeString().substring(0, 8);
}

export function isValidUrl(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
}

export function getErrors(values: ContentFormValues): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (values.uploadMode === "url") {
        if (!values.linkUrl.trim()) e.source = "URL is required.";
        else if (!isValidUrl(values.linkUrl)) e.source = "Please enter a valid URL.";
    }
    if (values.uploadMode === "file" && !values.file) e.source = "Please select a file.";
    if (!values.jobPosition) e.persona = "Please select a job position.";
    if (!values.contentType) e.contentType = "Please select a document type.";
    return e;
}

/** Starting values for the Add form. */
export function initialValues(userId: number): ContentFormValues {
    return {
        name: "",
        linkUrl: "",
        ownerID: userId,
        contentType: "",
        status: "new",
        jobPosition: "",
        uploadMode: "url",
        file: null,
        dateModified: new Date(),
        lastModifiedTime: nowTimeString(),
        dateExpiration: undefined,
    };
}

/** Populate form values from an existing ContentItem for the Edit form. */
export function fromContentItem(item: ContentItem): ContentFormValues {
    const lastMod = new Date(item.lastModified);
    return {
        name: item.displayName,
        linkUrl: item.linkURL ?? "",
        ownerID: item.ownerID ?? 0,
        contentType: item.contentType,
        status: item.status ?? "new",
        jobPosition: item.targetPersona,
        uploadMode: item.linkURL ? "url" : "file",
        file: null,
        dateModified: lastMod,
        lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        dateExpiration: item.expiration ? new Date(item.expiration) : undefined,
    };
}
