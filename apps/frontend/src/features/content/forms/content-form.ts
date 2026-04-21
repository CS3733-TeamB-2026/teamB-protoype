import type { ContentItem } from "@/lib/types.ts";

/**
 * Shared form state for both Add and Edit content dialogs.
 *
 * `contentType` and `status` use `"none"` as a sentinel for "not selected"
 * so the shadcn `<Select>` can show its placeholder. Both fields are required —
 * `getErrors` rejects `"none"` at submission time, and the `<Select>` value is
 * mapped to `""` in the JSX (which triggers the placeholder) so `"none"` is
 * never a visible option the user can pick.
 *
 * `dateModified` + `lastModifiedTime` are kept separate because the date
 * picker returns a `Date` object and the time input returns an HH:MM:SS string;
 * they are merged into a single ISO timestamp only in `buildContentFormData`.
 *
 * `uploadMode` controls which content-source UI is shown (URL text field vs
 * file picker). Only one of `linkUrl` or `file` will be sent to the server
 * depending on the mode.
 */
export type ContentFormValues = {
    name: string;
    linkUrl: string;
    ownerID: number | null;
    contentType: "reference" | "workflow" | "none";
    status: "new" | "inProgress" | "complete" | "none";
    /** Matches the `targetPersona` enum on the backend / Prisma schema. */
    targetPersona: string;
    uploadMode: "url" | "file";
    file: File | null;
    dateModified: Date | undefined;
    /** HH:MM:SS string from `<input type="time" step="1">`, merged with `dateModified` on submit. */
    lastModifiedTime: string;
    dateExpiration: Date | undefined;
    tags: string[];
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
 * Validation is intentionally kept here (not inside `useContentForm`) so it
 * can be called outside React if needed and keeps the hook simple.
 *
 * `isEdit` relaxes the file/URL source requirement: when editing, the server
 * keeps the existing file/link if no new one is provided, so an empty source
 * field is acceptable.
 */
export function getErrors(values: ContentFormValues, isEdit = false): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (values.uploadMode === "url") {
        if (!values.linkUrl.trim()) e.source = "URL is required.";
        else if (!isValidUrl(values.linkUrl)) e.source = "Please enter a valid URL.";
    }
    if (values.uploadMode === "file" && !values.file && !isEdit) e.source = "Please select a file.";
    if (!values.targetPersona) e.persona = "Target persona is required.";
    if (values.contentType === "none") e.contentType = "Please select a document type.";
    if (values.status === "none") e.status = "Please select a status.";
    return e;
}

/**
 * Starting values for the Add form.
 *
 * `ownerID` defaults to the current user so they don't have to pick themselves.
 * `targetPersona` likewise defaults to the current user's persona — both can
 * be overridden freely before submitting.
 */
export function initialValues(userId: number, userPersona = ""): ContentFormValues {
    return {
        name: "",
        linkUrl: "",
        ownerID: userId,
        contentType: "none",
        status: "none",
        targetPersona: userPersona,
        uploadMode: "url",
        file: null,
        dateModified: new Date(),
        lastModifiedTime: nowTimeString(),
        dateExpiration: undefined,
        tags: [],
    };
}

/**
 * Serialises form values into a `FormData` object ready to POST/PUT to
 * `/api/content`.
 *
 * Notes:
 * - `contentType`/`status` sentinels (`"none"`) are blocked by `getErrors`
 *   before this is called, but are mapped to `""` here as a safety net.
 * - `dateModified` and `lastModifiedTime` are merged into one ISO timestamp.
 * - The `file` field is only appended in file-upload mode; URL mode sends an
 *   empty `linkURL` string instead and leaves `file` off the payload.
 * - FormData cannot send arrays natively — `tags` is JSON-serialised and
 *   parsed with `JSON.parse(payload.tags || "[]")` on the backend.
 */
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
    formData.append("targetPersona", values.targetPersona);
    formData.append("tags", JSON.stringify(values.tags));
    if (values.uploadMode === "file" && values.file) {
        formData.append("file", values.file);
    }
    return formData;
}

/**
 * Wraps XHR in a Promise with upload-progress tracking and abort support.
 *
 * Used by the Add/Edit dialogs instead of `fetch` when a file is attached, so
 * the upload percentage can be reported in real time via `onProgress` and the
 * request can be cancelled mid-flight by aborting the provided `signal`.
 *
 * Returns a minimal response-like object to match the `fetch` Response API used
 * in the non-file path, so both code paths can share the same success/error
 * handling logic.
 */
export function xhrFetch(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: FormData,
    onProgress: (pct: number) => void,
    signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (const [k, v] of Object.entries(headers)) {
            xhr.setRequestHeader(k, v);
        }
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
        });
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.onabort = () => reject(Object.assign(new Error("Upload cancelled"), { name: "AbortError" }));
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
        xhr.send(body);
    });
}

/** Populate form values from an existing `ContentItem` for the Edit form. */
export function fromContentItem(item: ContentItem): ContentFormValues {
    return {
        name: item.displayName,
        linkUrl: item.linkURL ?? "",
        ownerID: item.ownerId ?? null,
        contentType: item.contentType,
        status: item.status,
        targetPersona: item.targetPersona,
        // If the item has a link it's URL mode; otherwise file mode (no File
        // object — the server keeps the existing file unless a new one is sent).
        uploadMode: item.linkURL ? "url" : "file",
        file: null,
        // Default to now so editing always stamps the current time unless the
        // user picks a file (which supplies its own lastModified timestamp).
        dateModified: new Date(),
        lastModifiedTime: nowTimeString(),
        dateExpiration: item.expiration ? new Date(item.expiration) : undefined,
        tags: item.tags ?? [],
    };
}
