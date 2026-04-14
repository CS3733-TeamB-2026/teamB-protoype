import type { ContentItem } from "@/pages/ViewContent.tsx";

export type ContentFormValues = {
    name: string;
    linkUrl: string;
    ownerID: number | null;
    contentType: "reference" | "workflow" | "";
    status: "new" | "inProgress" | "complete" | "";
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

export function getErrors(values: ContentFormValues, isEdit = false): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (values.uploadMode === "url") {
        if (!values.linkUrl.trim()) e.source = "URL is required.";
        else if (!isValidUrl(values.linkUrl)) e.source = "Please enter a valid URL.";
    }
    if (values.uploadMode === "file" && !values.file && !isEdit) e.source = "Please select a file.";
    if (!values.jobPosition) e.persona = "Please select a job position.";
    return e;
}

/** Starting values for the Add form. */
export function initialValues(userId: number): ContentFormValues {
    return {
        name: "",
        linkUrl: "",
        ownerID: userId,
        contentType: "",
        status: "",
        jobPosition: "",
        uploadMode: "url",
        file: null,
        dateModified: new Date(),
        lastModifiedTime: nowTimeString(),
        dateExpiration: undefined,
    };
}

/** Build a FormData with all fields shared between create and update. */
export function buildContentFormData(values: ContentFormValues): FormData {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("linkURL", values.uploadMode === "url" ? values.linkUrl : "");
    formData.append("ownerID", values.ownerID != null ? values.ownerID.toString() : "");
    formData.append("contentType", values.contentType);
    formData.append("status", values.status ?? "");

    const lastModifiedDate = values.dateModified ? new Date(values.dateModified) : new Date();
    const [lmh, lmm, lms] = values.lastModifiedTime.split(":").map(Number);
    lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
    formData.append("lastModified", lastModifiedDate.toISOString());

    if (values.dateExpiration) {
        const expDate = new Date(values.dateExpiration);
        expDate.setHours(0, 0, 0, 0);
        formData.append("expiration", expDate.toISOString());
    } else {
        formData.append("expiration", "");
    }
    formData.append("targetPersona", values.jobPosition);
    if (values.uploadMode === "file" && values.file) {
        formData.append("file", values.file);
    }
    return formData;
}

/** Populate form values from an existing ContentItem for the Edit form. */
export function fromContentItem(item: ContentItem): ContentFormValues {
    const lastMod = new Date(item.lastModified);
    return {
        name: item.displayName,
        linkUrl: item.linkURL ?? "",
        ownerID: item.ownerId ?? null,
        contentType: item.contentType,
        status: item.status ?? "",
        jobPosition: item.targetPersona,
        uploadMode: item.linkURL ? "url" : "file",
        file: null,
        dateModified: lastMod,
        lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        dateExpiration: item.expiration ? new Date(item.expiration) : undefined,
    };
}
