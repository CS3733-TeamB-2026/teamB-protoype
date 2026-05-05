import type { ServiceReq, RequestType } from "@/lib/types.ts";

/**
 * Shared form state for both Add and Edit service req dialogs.
 *
 * `type` uses `"none"` as a sentinel for "not selected" so that shadcn
 * `<Select>` can show a placeholder item — validated and rejected by `getErrors`.
 *
 * `created` is never included here — the backend sets it to `now()` on creation
 * and never overwrites it on update.
 *
 * `linkMode` drives the picker shown in the form. `buildServiceReqJSON` sends only
 * the active link ID and nulls the other, so the backend never receives both at once.
 * `notes` is stored as `""` and serialised as `null` when blank.
 */
export type ServiceReqFormValues = {
    id: number | undefined,
    name: string;
    deadline: Date | undefined;
    assigneeId: number | undefined;
    type: RequestType | "none";
    notes: string;
    linkMode: "none" | "content" | "collection"; // controls which picker is shown; only one ID is sent
    linkedContentId: number | null;
    linkedCollectionId: number | null;
};

/**
 * Returns a map of field name → error message for any invalid fields.
 * An empty object means the form is valid.
 */
export function getErrors(values: ServiceReqFormValues): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.assigneeId) e.assigneeId = "Assignee is required.";
    if (values.type === "none") e.type = "Service Request Type is required.";
    if (!values.deadline) e.deadline = "Deadline is required.";
    return e;
}

/** Starting values for the Add form. */
export function initialValues(): ServiceReqFormValues {
    return {
        id: undefined,
        name: "",
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
    if (values.deadline === undefined) throw new Error("Deadline is required.");

    const deadlineDate = new Date(values.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return JSON.stringify({
        id: values.id,
        name: values.name,
        assigneeId: values.assigneeId,
        type: values.type,
        // `created` is omitted — the backend sets it on creation and never overwrites it
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
 *
 * `created` is not included in form state — it is read-only after creation.
 */
export function fromServiceReqItem(item: ServiceReq): ServiceReqFormValues {
    const linkMode = item.linkedContent != null ? "content"
        : item.linkedCollection != null ? "collection"
        : "none";
    return {
        id: item.id,
        name: item.name,
        assigneeId: item.assigneeId ?? undefined,
        type: item.type as RequestType | "none",
        deadline: new Date(item.deadline),
        notes: item.notes ?? "",
        linkMode,
        linkedContentId: item.linkedContent?.id ?? null,
        linkedCollectionId: item.linkedCollection?.id ?? null,
    };
}
