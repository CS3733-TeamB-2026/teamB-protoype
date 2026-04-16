import { useState } from "react";
import { type ContentFormValues, getErrors } from "@/lib/content-form.ts";

/**
 * Shared form state and validation for Add and Edit content dialogs.
 *
 * Validation is deferred: `errors` is only populated after the user first
 * attempts to submit (`submitted = true`), so fields don't show error states
 * before the user has had a chance to fill them in. `hasErrors` always reflects
 * the current validity regardless of `submitted`, so the Submit button can be
 * disabled as soon as the form becomes invalid after first submission.
 *
 * `formKey` is incremented by `reset()` so callers can pass it as the `key`
 * prop to `ContentFormFields`, forcing a full remount and clearing any internal
 * component state (e.g., the file picker's local error message).
 */
export function useContentForm(initial: ContentFormValues, isEdit = false) {
    const [values, setValues] = useState<ContentFormValues>(initial);
    const patch = (p: Partial<ContentFormValues>) => setValues(prev => ({ ...prev, ...p }));
    const [submitted, setSubmitted] = useState(false);
    const [formKey, setFormKey] = useState(0);

    const errors = submitted ? getErrors(values, isEdit) : {};
    const hasErrors = Object.keys(getErrors(values, isEdit)).length > 0;

    const reset = (newInitial: ContentFormValues) => {
        setValues(newInitial);
        setSubmitted(false);
        setFormKey(k => k + 1);
    };

    return { values, patch, submitted, setSubmitted, errors, hasErrors, formKey, reset };
}
