import type { ServiceReqItem } from "@/lib/types.ts";

/**
 * Shared form state for both Add and Edit service req dialogs.
 *
 * `type` uses `"none"` as a sentinel for "not selected" so
 * that shadcn `<Select>` can show a placeholder item — the backend receives an
 * empty string for these when `"none"` is submitted (see `buildServiceReqFormData`).
 *
 * `createdDate` + `createdTime` are kept separate because the date
 * picker returns a `Date` and the time input returns an HH:MM:SS string; they
 * are merged into a single ISO timestamp only in `buildContentFormData`.
 */
export type ServiceReqFormValues = {
    name: string;
    createdDate: Date;
    createdTime: string; // HH:MM:SS string from <input type="time" step="1">
    deadline: Date | undefined;
    ownerId: number;
    assigneeId: number | undefined;
    type: "reviewClaim" | "requestAdjuster" | "checkClaim" | "none";
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
    if (!values.ownerId) e.ownerId = "Owner is required.";
    if (values.type === "none") e.type = "Service Request Type is required.";
    if (!values.createdDate) e.createdDate = "Created Date is required.";
    if (!values.createdTime) e.createdTime = "Created Time is required.";
    if (!values.deadline) e.deadline = "Deadline is required.";
    return e;
}

/** Starting values for the Add form. */
export function initialValues(userId: number): ServiceReqFormValues {
    return {
        name: "",
        createdDate: new Date(),
        createdTime: nowTimeString(), // HH:MM:SS string from <input type="time" step="1">
        deadline: undefined,
        ownerId: userId,
        assigneeId: undefined,
        type: "none",
    };
}

/** Build a FormData with all fields shared between create and update. */
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
        name: values.name,
        ownerId: values.ownerId,
        assigneeId: values.assigneeId,
        type: values.type,
        created: created.toISOString(),
        deadline: deadlineDate.toISOString(),
    })
}

/** Populate form values from an existing ServiceReqItem for the Edit form. */
export function fromServiceReqItem(item: ServiceReqItem): ServiceReqFormValues {
    const createdDate = new Date(item.created);
    return {
        name: item.name,
        ownerId: item.ownerId,
        assigneeId: item.assigneeId,
        type: item.type,
        createdDate: createdDate,
        createdTime: createdDate.toTimeString().substring(0, 8),
        deadline: new Date(item.deadline),
    };
}
