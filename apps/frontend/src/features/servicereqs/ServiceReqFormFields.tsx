import * as React from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { EmployeePicker } from "@/components/shared/EmployeePicker.tsx";
import { ContentPicker } from "@/components/shared/ContentPicker.tsx";
import { CollectionPicker } from "@/components/shared/CollectionPicker.tsx";
import { type ServiceReqFormValues } from "@/features/servicereqs/servicereq-form.ts";

interface Props {
    values: ServiceReqFormValues;
    patch: (p: Partial<ServiceReqFormValues>) => void;
    errors: Record<string, string>;
    showLastModified?: boolean;
}

/**
 * Shared field set rendered by both `AddServiceReqDialog` and `EditServiceReqDialog`.
 *
 * Purely presentational — all form state lives in the parent dialog via
 * `useServiceReqForm` and flows in through props. The parent passes `key={formKey}`
 * so this component remounts on reset, which clears the two popover-open states.
 *
 * `showLastModified` is false by default. Both dialogs currently pass `true`; the
 * prop exists to allow embedding the field set in a read-only or compact context.
 *
 * The Linked Resource section uses `linkMode` to switch between ContentPicker and
 * CollectionPicker. Switching modes resets both IDs to null so stale selections
 * from the previous picker are never serialised.
 */
export function ServiceReqFormFields({ values, patch, errors, showLastModified = false }: Props) {
    const [openCreatedDate, setOpenCreatedDate] = React.useState(false);
    const [openDeadlineDate, setOpenDeadlineDate] = React.useState(false);

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
                    placeholder="Enter service request name"
                    value={values.name}
                    onChange={(e) => patch({ name: e.target.value })}
                />
                {errors.name && <FieldDescription className="text-destructive">{errors.name}</FieldDescription>}
            </Field>

            <div className="py-6"><Separator className="bg-primary" /></div>

            <div className="flex flex-row gap-2 justify-center">

                {/* Assignee */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg mb-1">Assignee Employee</FieldLabel>
                    <EmployeePicker
                        selectedId={values.assigneeId ?? null}
                        onSelect={(id) => patch({ assigneeId: id ?? undefined })}
                    />
                </Field>

            </div>

            <div className="py-6"><Separator className="bg-primary" /></div>

            {/* Dates */}
            <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                {showLastModified && (
                    <>
                        <Field className="bg-background flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="date-modified">
                                Last Modified Date
                            </FieldLabel>
                            <Popover open={openCreatedDate} onOpenChange={setOpenCreatedDate}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-modified"
                                        className="justify-start font-normal text-sm h-10"
                                    >
                                        {values.createdDate ? values.createdDate.toLocaleDateString() : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={values.createdDate}
                                        defaultMonth={values.createdDate}
                                        captionLayout="dropdown"
                                        onSelect={(date) => { patch({ createdDate: date }); setOpenCreatedDate(false); }}
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
                                value={values.createdTime}
                                onChange={(e) => patch({ createdTime: e.target.value })}
                                className="font-normal md:text-sm h-10! appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                        </Field>

                    </>
                )}

                <Field className="bg-background flex-1">
                    <FieldLabel className="text-primary text-lg" htmlFor="date-expiration">
                        Expiration Date
                    </FieldLabel>
                    <Popover open={openDeadlineDate} onOpenChange={setOpenDeadlineDate}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" id="date-expiration" className="justify-start font-normal text-sm h-10">
                                {values.deadline ? values.deadline.toLocaleDateString() : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={values.deadline}
                                defaultMonth={values.deadline}
                                captionLayout="dropdown"
                                onSelect={(date) => { patch({ deadline: date }); setOpenDeadlineDate(false); }}
                            />
                        </PopoverContent>
                    </Popover>
                </Field>
            </div>

            <div className="py-6"><Separator className="bg-primary" /></div>

            <div className="flex flex-row gap-2">
                {/* Service Request Type */}
                <Field className="bg-background">
                    <FieldLabel className="text-primary text-lg">Type of Document</FieldLabel>
                    <Select value={values.type} onValueChange={(v) => patch({ type: v as ServiceReqFormValues["type"] })}>
                        <SelectTrigger className="bg-background h-10! text-sm">
                            <SelectValue placeholder="Select service request type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="reviewClaim">Review Claim</SelectItem>
                            <SelectItem value="requestAdjuster">Request Adjuster</SelectItem>
                            <SelectItem value="checkClaim">Check Claim</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

            </div>

            <div className="py-6"><Separator className="bg-primary" /></div>

            {/* Notes */}
            <Field className="bg-background">
                <FieldLabel className="text-primary text-lg" htmlFor="input-notes">Notes</FieldLabel>
                <Textarea
                    id="input-notes"
                    placeholder="Add any notes..."
                    value={values.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    className="w-full resize-none"
                    rows={4}
                />
            </Field>

            <div className="py-6"><Separator className="bg-primary" /></div>

            {/* Linked Resource */}
            <Field className="bg-background">
                <FieldLabel className="text-primary text-lg mb-4">Linked Resource</FieldLabel>
                <RadioGroup
                    value={values.linkMode}
                    onValueChange={(v) => {
                        const mode = v as ServiceReqFormValues["linkMode"];
                        patch({
                            linkMode: mode,
                            linkedContentId: null,
                            linkedCollectionId: null,
                        });
                    }}
                    className="flex gap-6 pb-2"
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="none" id="link-none" />
                        <Label htmlFor="link-none" className="md:text-sm">None</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="content" id="link-content" />
                        <Label htmlFor="link-content" className="md:text-sm">Content</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="collection" id="link-collection" />
                        <Label htmlFor="link-collection" className="md:text-sm">Collection</Label>
                    </div>
                </RadioGroup>

                {values.linkMode === "content" && (
                    <ContentPicker
                        selectedId={values.linkedContentId}
                        onSelect={(id) => patch({ linkedContentId: id })}
                    />
                )}
                {values.linkMode === "collection" && (
                    <CollectionPicker
                        selectedId={values.linkedCollectionId}
                        onSelect={(id) => patch({ linkedCollectionId: id })}
                        publicOnly
                    />
                )}
            </Field>

        </div>
    );
}
