import type { ContentItem } from "@/lib/types.ts";

/**
 * Shared form state for both Add and Edit content dialogs.
 *
 * `contentType` and `status` use `"none"` as a sentinel for "not selected" so
 * that shadcn `<Select>` can show a placeholder item — the backend receives an
 * empty string for these when `"none"` is submitted (see `buildContentFormData`).
 *
 * `dateModified` + `lastModifiedTime` are kept separate because the date
 * picker returns a `Date` and the time input returns an HH:MM:SS string; they
 * are merged into a single ISO timestamp only in `buildContentFormData`.
 */
export type ContentFormValues = {
    name: string;
    linkUrl: string;
    ownerID: number | null;
    contentType: "reference" | "workflow" | "none";
    status: "new" | "inProgress" | "complete" | "none";
    jobPosition: string;
    uploadMode: "url" | "file";
    file: File | null;
    dateModified: Date | undefined;
    lastModifiedTime: string; // HH:MM:SS string from <input type="time" step="1">
    dateExpiration: Date | undefined;
};

export function nowTimeString(): string {
    return new Date().toTimeString().substring(0, 8);
}

export function isValidUrl(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
}

/**
 * Returns a map of field name → error message for any invalid fields.
 * An empty object means the form is valid.
 *
 * `isEdit` relaxes the file requirement: existing content can be saved
 * without re-uploading a file (the server keeps the current file).
 */
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
        contentType: "none",
        status: "none",
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
    formData.append("contentType", values.contentType === "none" ? "" : values.contentType);
    formData.append("status", values.status === "none" ? "" : values.status);

    // Merge the date picker value and the separate time input into one timestamp.
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
        status: item.status ?? "none",
        jobPosition: item.targetPersona,
        uploadMode: item.linkURL ? "url" : "file",
        file: null,
        dateModified: lastMod,
        lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        dateExpiration: item.expiration ? new Date(item.expiration) : undefined,
    };
}
