import * as React from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { EmployeePicker } from "@/components/shared/EmployeePicker.tsx";
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
 * Receives all form state via props (`values`, `patch`, `errors`) so it owns
 * no form logic itself — it is purely presentational. The parent passes a
 * `key` tied to `formKey` from `useServiceReqForm` so this component remounts on
 * reset, clearing the local `filePickError` state below.
 *
 * `showLastModified` is false by default; the Add and Edit dialogs both pass
 * `true`. The prop exists so the field set could be embedded in a context
 * where the last-modified date is not user-editable.
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

        </div>
    );
}
