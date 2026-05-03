import type { ServiceReq, RequestType } from "@/lib/types.ts";

/**
 * Shared form state for both Add and Edit service req dialogs.
 *
 * `type` uses `"none"` as a sentinel for "not selected" so that shadcn
 * `<Select>` can show a placeholder item — validated and rejected by `getErrors`.
 *
 * `createdDate` + `createdTime` are kept separate because the date picker returns
 * a `Date` and the time input returns an HH:MM:SS string; they are merged into a
 * single ISO timestamp only in `buildServiceReqJSON`.
 *
 * `linkMode` drives the picker shown in the form. `buildServiceReqJSON` sends only
 * the active link ID and nulls the other, so the backend never receives both at once.
 * `notes` is stored as `""` and serialised as `null` when blank.
 */
export type ServiceReqFormValues = {
    id: number | undefined,
    name: string;
    createdDate: Date;
    createdTime: string; // HH:MM:SS string from <input type="time" step="1">
    deadline: Date | undefined;
    assigneeId: number | undefined;
    type: RequestType | "none";
    notes: string;
    linkMode: "none" | "content" | "collection"; // controls which picker is shown; only one ID is sent
    linkedContentId: number | null;
    linkedCollectionId: number | null;
};

export function nowTimeString(): string {
    return new Date().toTimeString().substring(0, 8);
}

/**
 * Returns a map of field name → error message for any invalid fields.
 * An empty object means the form is valid.
 */
export function getErrors(values: ServiceReqFormValues): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.assigneeId) e.assigneeId = "Assignee is required.";
    if (values.type === "none") e.type = "Service Request Type is required.";
    if (!values.createdDate) e.createdDate = "Created Date is required.";
    if (!values.createdTime) e.createdTime = "Created Time is required.";
    if (!values.deadline) e.deadline = "Deadline is required.";
    return e;
}

/** Starting values for the Add form. */
export function initialValues(): ServiceReqFormValues {
    return {
        id: undefined,
        name: "",
        createdDate: new Date(),
        createdTime: nowTimeString(),
        deadline: undefined,
        assigneeId: undefined,
        type: "none",
        notes: "",
        linkMode: "none",
        linkedContentId: null,
        linkedCollectionId: null,
    };
}

/** Serialise form state to a JSON string for both create and update requests. */
export function buildServiceReqJSON(values: ServiceReqFormValues): string {
    if (values.assigneeId === undefined) throw new Error("Assignee is required.");
    if (values.type === undefined) throw new Error("Type is required.");

    // Merge the date picker value and the separate time input into one timestamp.
    const created = new Date(values.createdDate);
    const [lmh, lmm, lms] = values.createdTime.split(":").map(Number);
    created.setHours(lmh, lmm, lms ?? 0, 0);
    if (values.deadline === undefined) throw new Error("Deadline is required.");
    const deadlineDate = new Date(values.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return JSON.stringify({
        id: values.id,
        name: values.name,
        assigneeId: values.assigneeId,
        type: values.type,
        created: created.toISOString(),
        deadline: deadlineDate.toISOString(),
        notes: values.notes.trim() || null,
        linkedContentId: values.linkMode === "content" ? values.linkedContentId : null,
        linkedCollectionId: values.linkMode === "collection" ? values.linkedCollectionId : null,
    })
}

/**
 * Populates form values from an existing `ServiceReq` for the Edit form.
 *
 * `linkMode` is derived from the populated back-relation fields (`linkedContent`,
 * `linkedCollection`) rather than any scalar ID on the SR row — because the FK
 * lives on the other side, the SR model has no `linkedContentId` scalar field.
 */
export function fromServiceReqItem(item: ServiceReq): ServiceReqFormValues {
    const createdDate = new Date(item.created);
    const linkMode = item.linkedContent != null ? "content"
        : item.linkedCollection != null ? "collection"
        : "none";
    return {
        id: item.id,
        name: item.name,
        assigneeId: item.assigneeId ?? undefined,
        type: item.type as RequestType | "none",
        createdDate: createdDate,
        createdTime: createdDate.toTimeString().substring(0, 8),
        deadline: new Date(item.deadline),
        notes: item.notes ?? "",
        linkMode,
        linkedContentId: item.linkedContent?.id ?? null,
        linkedCollectionId: item.linkedCollection?.id ?? null,
    };
}
