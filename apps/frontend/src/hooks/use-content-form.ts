import { useState } from "react";
import { type ContentFormValues, getErrors } from "@/lib/content-form.ts";

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
