import * as React from "react";
import { useState, useRef } from "react";
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
import { TagInput } from "@/features/content/tags/TagInput.tsx";

type ContentDialogMode = "add" | "edit";

interface Props {
    values: ContentFormValues;
    patch: (p: Partial<ContentFormValues>) => void;
    errors: Record<string, string>;
    mode: ContentDialogMode;
}

/**
 * Shared field set rendered by both `AddContentDialog` and `EditContentDialog`.
 *
 * **Purely presentational** — all form state lives in `useContentForm` (in the
 * parent dialog) and flows in via props. This component never owns the source of
 * truth; it calls `patch` to request changes and the parent re-renders with new
 * `values`.
 *
 * **Remounting on reset**: The parent passes `key={formKey}` (from `useContentForm`)
 * so this component is fully unmounted and recreated when the form is reset. That
 * clears `filePickError` state and the `preAutoFillState` ref automatically —
 * no manual cleanup needed.
 *
 * **Auto-fill behaviour (add mode only)**:
 * - Picking a file fills the display name (from filename) and last-modified date
 *   (from the file's `lastModified` property).
 * - A URL preview loading fills the name (from `<title>`) and stamps the current
 *   date/time as last-modified.
 * - When the source is removed (file cleared, URL emptied, or mode switched to
 *   URL), the pre-autofill name and date are restored from `preAutoFillState`.
 * - Only the first autofill saves the pre-state. Re-picking a file or loading
 *   a second URL does NOT overwrite the saved state, so removing the source
 *   always reverts to what the user had before any autofill happened.
 *
 * **Edit mode**: name is never auto-filled; `onPreviewLoaded` is a no-op (the
 * URL preview fires on mount for existing URLs and we don't want to silently
 * overwrite the current date). Date/time always defaults to now (see
 * `fromContentItem` in `content-form.ts`), not the stored last-modified value.
 */
export function ContentFormFields({ values, patch, errors, mode }: Props) {
    const [openModifiedDate, setOpenModifiedDate] = React.useState(false);
    const [openExpirationDate, setOpenExpirationDate] = React.useState(false);
    // Client-side MIME validation error lives here rather than in useContentForm
    // because it's produced before the file enters form state (we reject bad files
    // and never call patch with them).
    const [filePickError, setFilePickError] = useState<string | null>(null);

    // Snapshot taken before the first autofill so we can revert when the source
    // is removed. `null` = no autofill has happened yet. Once set, it stays until
    // restorePreAutoFill() consumes it — re-picking a file doesn't overwrite it.
    const preAutoFillState = useRef<{
        name: string;
        dateModified: Date | undefined;
        lastModifiedTime: string;
    } | null>(null);

    const savePreAutoFill = () => {
        if (!preAutoFillState.current) {
            preAutoFillState.current = {
                name: values.name,
                dateModified: values.dateModified,
                lastModifiedTime: values.lastModifiedTime,
            };
        }
    };

    const restorePreAutoFill = (): Partial<ContentFormValues> => {
        if (!preAutoFillState.current) return {};
        const { name, dateModified, lastModifiedTime } = preAutoFillState.current;
        preAutoFillState.current = null;
        return { name, dateModified, lastModifiedTime };
    };

    const handleFileChange = (file: File | null) => {
        setFilePickError(null);
        if (!file) {
            const restored = restorePreAutoFill();
            // Date always reverts to what it was before autofill. Name only reverts
            // in add mode — in edit mode we leave whatever the user typed untouched.
            patch({ file: null, ...restored, ...(mode === "edit" ? { name: values.name } : {}) });
            return;
        }

        const validation = validateFileForUpload(file);
        if (!validation.ok) {
            // Reject at the picker level; never let a bad file into form state.
            setFilePickError(validation.reason);
            patch({ file: null });
            return;
        }

        savePreAutoFill();
        const lastMod = new Date(file.lastModified);
        const updates: Partial<ContentFormValues> = {
            file,
            // Pull last-modified from the file's own metadata rather than using now.
            dateModified: lastMod,
            lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        };
        // Only autofill the name in add mode — in edit mode the existing display
        // name belongs to the record and shouldn't be silently replaced.
        if (mode === "add") updates.name = stripExtension(file.name);
        patch(updates);
    };

    return (
        <div className="mx-4">
            {/* Name */}
            <Field className="bg-background">
                <FieldLabel className="text-primary text-lg" htmlFor="input-field-name">
                    Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                    className="h-8 md:text-sm"
                    id="input-field-name"
                    type="text"
                    placeholder="Enter document name"
                    value={values.name}
                    onChange={(e) => patch({ name: e.target.value })}
                />
                {errors.name && <FieldDescription className="text-destructive">{errors.name}</FieldDescription>}
            </Field>

            <div className="py-4"><Separator className="bg-primary" /></div>

            {/* Content Source */}
            <Field className="bg-background">
                <FieldLabel className="text-primary text-lg mb-4">
                    Content Source <span className="text-destructive">*</span>
                </FieldLabel>
                <RadioGroup
                    value={values.uploadMode}
                    onValueChange={(v) => {
                        const newMode = v as "url" | "file";
                        patch({ uploadMode: newMode });
                        if (newMode === "url" && values.file) {
                            // Leaving file mode while a file is selected — treat it
                            // like clearing the file so the pre-autofill state is restored.
                            handleFileChange(null);
                        }
                        if (newMode === "file" && values.file) {
                            // Re-entering file mode with a previously selected file —
                            // re-run autofill so the name/date stay in sync.
                            handleFileChange(values.file);
                        }
                    }}
                    className="flex gap-6 pb-2"
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="url" id="mode-url" />
                        <Label htmlFor="mode-url" className="md:text-sm">URL</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="file" id="mode-file" />
                        <Label htmlFor="mode-file" className="md:text-sm">File Upload</Label>
                    </div>
                </RadioGroup>

                {values.uploadMode === "url" ? (
                    <UrlSourceField
                        value={values.linkUrl}
                        onChange={(url) => {
                            patch({ linkUrl: url });
                            if (!url) {
                                // URL was cleared — restore whatever the name/date were
                                // before the preview autofill, same as removing a file.
                                const restored = restorePreAutoFill();
                                if (Object.keys(restored).length) patch(restored);
                            }
                        }}
                        onPreviewLoaded={(preview) => {
                            // UrlSourceField fires this callback on mount too (for cached
                            // previews of existing URLs). Guard against that silently
                            // stomping on the existing record's name/date in edit mode.
                            if (mode === "edit") return;
                            savePreAutoFill();
                            patch({
                                dateModified: new Date(),
                                lastModifiedTime: nowTimeString(),
                                ...(preview.title ? { name: preview.title } : {}),
                            });
                        }}
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

            <div className="py-6"><Separator className="bg-primary" /></div>

            <div className="flex flex-row gap-2">
                {/* Owner */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg mb-1">Owner Employee</FieldLabel>
                    <EmployeePicker
                        selectedId={values.ownerID}
                        onSelect={(id, employee) => {
                            const updates: Partial<ContentFormValues> = { ownerID: id ?? null };
                            // Auto-fill persona from the selected employee in add mode only.
                            // In edit mode the existing persona belongs to the record and
                            // shouldn't change just because the owner is reassigned.
                            if (mode === "add" && employee?.persona) {
                                updates.targetPersona = employee.persona;
                            }
                            patch(updates);
                        }}
                    />
                </Field>

                <Separator className="bg-primary mx-2" orientation="vertical" />

                {/* Target Persona */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg mb-1">
                        Target Persona <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={values.targetPersona} onValueChange={(v) => patch({ targetPersona: v })}>
                        <SelectTrigger className="bg-background h-10! text-sm">
                            <SelectValue placeholder="Select target persona" />
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
            </div>

            <div className="py-6"><Separator className="bg-primary" /></div>

            {/* Dates */}
            <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                <Field className="bg-background flex-1">
                    <FieldLabel className="text-primary text-lg" htmlFor="date-modified">
                        Last Modified Date
                    </FieldLabel>
                    <Popover open={openModifiedDate} onOpenChange={setOpenModifiedDate}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                id="date-modified"
                                className="justify-start font-normal text-sm h-10"
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
                    <FieldLabel className="text-primary text-lg" htmlFor="time-lastmodified">
                        Time
                    </FieldLabel>
                    <Input
                        type="time"
                        id="time-lastmodified"
                        step="1"
                        value={values.lastModifiedTime}
                        onChange={(e) => patch({ lastModifiedTime: e.target.value })}
                        disabled={values.uploadMode === "file" && values.file !== null}
                        className="font-normal md:text-sm h-10! appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                </Field>

                <Field className="bg-background flex-1">
                    <FieldLabel className="text-primary text-lg" htmlFor="date-expiration">
                        Expiration Date
                    </FieldLabel>
                    <Popover open={openExpirationDate} onOpenChange={setOpenExpirationDate}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" id="date-expiration" className="justify-start font-normal text-sm h-10">
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

            <div className="py-6"><Separator className="bg-primary" /></div>

            {/* Tags */}
            <Field className="bg-background">
                <FieldLabel className="text-primary text-lg">Tags</FieldLabel>
                <TagInput value={values.tags} onChange={(tags) => patch({ tags })} />
            </Field>

            <div className="py-6"><Separator className="bg-primary" /></div>

            <div className="flex flex-row gap-2">
                {/* Document Type */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg">
                        Type of Document <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                        value={values.contentType === "none" ? "" : values.contentType}
                        onValueChange={(v) => patch({ contentType: v as ContentFormValues["contentType"] })}
                    >
                        <SelectTrigger className="bg-background h-10! text-sm">
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="reference">Reference Content</SelectItem>
                            <SelectItem value="workflow">Workflow Content</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.contentType && <FieldDescription className="text-destructive">{errors.contentType}</FieldDescription>}
                </Field>

                <Separator className="bg-primary mx-2" orientation="vertical" />

                {/* Document Status */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg">
                        Document Status <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                        value={values.status === "none" ? "" : values.status}
                        onValueChange={(v) => patch({ status: v as ContentFormValues["status"] })}
                    >
                        <SelectTrigger className="bg-background h-10! text-sm">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && <FieldDescription className="text-destructive">{errors.status}</FieldDescription>}
                </Field>
            </div>

        </div>
    );
}
