import type { Employee, Persona } from "@/lib/types.ts";

export type EmployeeFormValues = {
    id: string;
    firstName: string;
    lastName: string;
    /** Empty string is the sentinel for "not selected". */
    persona: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export function lowestAvailableId(taken: Set<number>): number {
    let n = 1;
    while (taken.has(n)) n++;
    return n;
}

export function initialValues(takenIds?: Set<number>): EmployeeFormValues {
    return {
        id: takenIds && takenIds.size > 0 ? String(lowestAvailableId(takenIds)) : "",
        firstName: "",
        lastName: "",
        persona: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    };
}

/**
 * Returns a map of field name → error message for any invalid fields.
 * An empty object means the form is valid.
 */
export function getErrors(
    values: EmployeeFormValues,
    takenIds: Set<number>,
    checkNameTaken: (first: string, last: string) => string,
): Record<string, string> {
    const e: Record<string, string> = {};
    if (!values.firstName.trim()) e.firstName = "First name is required.";
    if (!values.lastName.trim()) e.lastName = "Last name is required.";
    else {
        const nameErr = checkNameTaken(values.firstName, values.lastName);
        if (nameErr) e.lastName = nameErr;
    }
    if (!values.id) {
        e.id = "ID is required.";
    } else {
        const n = Number(values.id);
        if (!Number.isInteger(n) || n < 1) e.id = "Must be a positive whole number.";
        else if (takenIds.has(n)) e.id = "This ID is already in use.";
    }
    if (!values.persona) e.persona = "Job position is required.";
    if (!values.username.trim()) e.username = "Username is required.";
    if (!values.email.trim()) e.email = "Email is required.";
    if (!values.password) e.password = "Password is required.";
    if (!values.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (values.password !== values.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
}

/** Serialises form values into the JSON payload for POST /api/employee/auth. */
export function buildPayload(values: EmployeeFormValues) {
    return {
        firstName: values.firstName,
        lastName: values.lastName,
        id: parseInt(values.id),
        persona: values.persona,
        username: values.username,
        email: values.email,
        password: values.password,
    };
}

/** Returns a minimal Employee object to pass to onSave after a successful create. */
export function toEmployee(values: EmployeeFormValues): Employee {
    return {
        id: parseInt(values.id),
        firstName: values.firstName,
        lastName: values.lastName,
        persona: values.persona as Persona,
        profilePhotoURI: "",
    };
}