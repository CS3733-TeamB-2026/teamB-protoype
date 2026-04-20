import * as React from "react";
import { useState } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { ALLOWED_ACCEPT_STRING, validateFileForUpload, stripExtension } from "@/lib/mime.ts";
import { UrlSourceField } from "@/features/content/forms/UrlSourceField.tsx";
import { FilePickerCard } from "@/components/shared/FilePickerCard.tsx";
import { EmployeePicker } from "@/components/shared/EmployeePicker.tsx";
import { type ContentFormValues, nowTimeString } from "@/features/content/forms/content-form.ts";

interface Props {
    values: ContentFormValues;
    patch: (p: Partial<ContentFormValues>) => void;
    errors: Record<string, string>;
    showLastModified?: boolean;
}

/**
 * Shared field set rendered by both `AddContentDialog` and `EditContentDialog`.
 *
 * Receives all form state via props (`values`, `patch`, `errors`) so it owns
 * no form logic itself — it is purely presentational. The parent passes a
 * `key` tied to `formKey` from `useContentForm` so this component remounts on
 * reset, clearing the local `filePickError` state below.
 *
 * The Last Modified date and time inputs are disabled when a file is selected
 * because the file's own `lastModified` timestamp is used instead. Switching
 * back to URL mode re-enables them.
 *
 * `showLastModified` is false by default; the Add and Edit dialogs both pass
 * `true`. The prop exists so the field set could be embedded in a context
 * where the last-modified date is not user-editable.
 */
export function ContentFormFields({ values, patch, errors, showLastModified = false }: Props) {
    const [openModifiedDate, setOpenModifiedDate] = React.useState(false);
    const [openExpirationDate, setOpenExpirationDate] = React.useState(false);
    // Kept local (not in useContentForm) because it comes from client-side MIME
    // validation that runs before the file enters form state.
    const [filePickError, setFilePickError] = useState<string | null>(null);

    const handleFileChange = (file: File | null) => {
        setFilePickError(null);
        if (!file) { patch({ file: null }); return; }

        const validation = validateFileForUpload(file);
        if (!validation.ok) {
            setFilePickError(validation.reason);
            patch({ file: null });
            return;
        }

        // Auto-fill name and last-modified from the file's own metadata so the
        // user doesn't have to enter them manually.
        const lastMod = new Date(file.lastModified);
        patch({
            file,
            name: stripExtension(file.name),
            dateModified: lastMod,
            lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        });
    };

    return (
        <>
            {/* Name */}
            <Field className="bg-background">
                <FieldLabel className="text-primary" htmlFor="input-field-name">
                    Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                    id="input-field-name"
                    type="text"
                    placeholder="Enter document name"
                    value={values.name}
                    onChange={(e) => patch({ name: e.target.value })}
                />
                {errors.name && <FieldDescription className="text-destructive">{errors.name}</FieldDescription>}
            </Field>

            <div className="py-2"><Separator className="bg-primary" /></div>

            {/* Content Source */}
            <Field className="bg-background">
                <FieldLabel className="text-primary">
                    Content Source <span className="text-destructive">*</span>
                </FieldLabel>
                <RadioGroup
                    value={values.uploadMode}
                    onValueChange={(v) => {
                        const mode = v as "url" | "file";
                        patch({ uploadMode: mode });
                        if (mode === "file" && values.file) {
                            handleFileChange(values.file);
                        }
                    }}
                    className="flex gap-6"
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="url" id="mode-url" />
                        <Label htmlFor="mode-url">URL</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="file" id="mode-file" />
                        <Label htmlFor="mode-file">File Upload</Label>
                    </div>
                </RadioGroup>

                {values.uploadMode === "url" ? (
                    <UrlSourceField
                        value={values.linkUrl}
                        onChange={(url) => patch({ linkUrl: url })}
                        onPreviewLoaded={(preview) => patch({
                            ...(preview.title ? { name: preview.title } : {}),
                            dateModified: new Date(),
                            lastModifiedTime: nowTimeString(),
                        })}
                        error={errors.source}
                    />
                ) : (
                    <FilePickerCard
                        file={values.file}
                        onChange={handleFileChange}
                        error={filePickError ?? errors.source}
                        accept={ALLOWED_ACCEPT_STRING}
                    />
                )}
            </Field>

            <div className="py-2"><Separator className="bg-primary" /></div>

            {/* Owner */}
            <Field className="bg-background">
                <FieldLabel className="text-primary">Owner Employee</FieldLabel>
                <EmployeePicker
                    selectedId={values.ownerID}
                    onSelect={(id) => patch({ ownerID: id ?? null })}
                />
            </Field>

            <div className="py-2"><Separator className="bg-primary" /></div>

            {/* Target Persona */}
            <Field className="bg-background">
                <FieldLabel className="text-primary">
                    Target Persona <span className="text-destructive">*</span>
                </FieldLabel>
                <Select value={values.jobPosition} onValueChange={(v) => patch({ jobPosition: v })}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="underwriter">Underwriter</SelectItem>
                        <SelectItem value="businessAnalyst">Business Analyst</SelectItem>
                        <SelectItem value="actuarialAnalyst">Actuarial Analyst</SelectItem>
                        <SelectItem value="EXLOperator">EXL Operations</SelectItem>
                        <SelectItem value="businessOps">Business Ops</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                {errors.persona && <FieldDescription className="text-destructive">{errors.persona}</FieldDescription>}
            </Field>

            <div className="py-2"><Separator className="bg-primary" /></div>

            {/* Dates */}
            <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                {showLastModified && (
                    <>
                        <Field className="bg-background flex-1">
                            <FieldLabel className="text-primary" htmlFor="date-modified">
                                Last Modified Date
                            </FieldLabel>
                            <Popover open={openModifiedDate} onOpenChange={setOpenModifiedDate}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-modified"
                                        className="justify-start font-normal"
                                        disabled={values.uploadMode === "file" && values.file !== null}
                                    >
                                        {values.dateModified ? values.dateModified.toLocaleDateString() : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={values.dateModified}
                                        defaultMonth={values.dateModified}
                                        captionLayout="dropdown"
                                        onSelect={(date) => { patch({ dateModified: date }); setOpenModifiedDate(false); }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </Field>

                        <Field className="w-32">
                            <FieldLabel className="text-primary" htmlFor="time-lastmodified">
                                Time
                            </FieldLabel>
                            <Input
                                type="time"
                                id="time-lastmodified"
                                step="1"
                                value={values.lastModifiedTime}
                                onChange={(e) => patch({ lastModifiedTime: e.target.value })}
                                disabled={values.uploadMode === "file" && values.file !== null}
                                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                        </Field>

                        <Separator className="bg-primary" orientation="vertical" />
                    </>
                )}

                <Field className="bg-background flex-1">
                    <FieldLabel className="text-primary" htmlFor="date-expiration">
                        Expiration Date
                    </FieldLabel>
                    <Popover open={openExpirationDate} onOpenChange={setOpenExpirationDate}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" id="date-expiration" className="justify-start font-normal">
                                {values.dateExpiration ? values.dateExpiration.toLocaleDateString() : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={values.dateExpiration}
                                defaultMonth={values.dateExpiration}
                                captionLayout="dropdown"
                                onSelect={(date) => { patch({ dateExpiration: date }); setOpenExpirationDate(false); }}
                            />
                        </PopoverContent>
                    </Popover>
                </Field>
            </div>

            <div className="py-2"><Separator className="bg-primary" /></div>

            {/* Document Type */}
            <Field className="bg-background">
                <FieldLabel className="text-primary">Type of Document</FieldLabel>
                <Select value={values.contentType} onValueChange={(v) => patch({ contentType: v as ContentFormValues["contentType"] })}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="reference">Reference Content</SelectItem>
                        <SelectItem value="workflow">Workflow Content</SelectItem>
                    </SelectContent>
                </Select>
            </Field>

            {/* Document Status */}
            <Field className="bg-background">
                <FieldLabel className="text-primary">Document Status</FieldLabel>
                <Select value={values.status} onValueChange={(v) => patch({ status: v as ContentFormValues["status"] })}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="inProgress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
        </>
    );
}
