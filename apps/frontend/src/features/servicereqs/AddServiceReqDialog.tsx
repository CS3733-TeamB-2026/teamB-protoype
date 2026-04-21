"use client"
import { ChevronDown } from "lucide-react"
import * as React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx"
import {
    Field,
    FieldLabel,
} from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Separator } from "@/components/ui/separator.tsx"
import { useAuth0 } from "@auth0/auth0-react"
import { formatLabel } from "@/lib/utils.ts"
import type { ServiceReq } from "@/lib/types.ts"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {Calendar} from "@/components/ui/calendar.tsx";
import {nowTimeString} from "@/features/content/forms/content-form.ts";

interface AddServiceReqDialog {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (created: ServiceReq) => void
}

export function AddServiceReqDialog({ open, onOpenChange, onSave }: AddServiceReqDialog) {
    const [openModifiedDate, setOpenModifiedDate] = React.useState(false);
    const [openExpirationDate, setOpenExpirationDate] = React.useState(false);

    const [type, setType] = useState("Select service req type")
    const [createdDate, setCreatedDate] = React.useState<Date | undefined>(new Date())
    const [createdTime, setCreatedTime] = React.useState(nowTimeString())
    const [deadline, setDeadline] = React.useState<Date>()
    const [assigneeId, setAssigneeId] = React.useState("")
    const [ownerId, setOwnerId] = React.useState("")
    const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)
    const { getAccessTokenSilently } = useAuth0()

    const resetForm = () => {
        setType("Select service req type")
        setCreatedTime(nowTimeString())
        setCreatedDate(new Date())
        setDeadline(undefined)
        setAssigneeId("")
        setOwnerId("")
        setSubmitResult(null)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        {/*TODO: This forces the user to enter all the fields, should probably do this on backend later */}
        if (!createdTime || !createdDate || !deadline || !ownerId || !assigneeId || type === "Select service req type") {
            setSubmitResult("error")
            return
        }
        try {
            const token = await getAccessTokenSilently();

            // Merge the date picker value and the separate time input into one timestamp.
            const lastModifiedDate = createdDate ? new Date(createdDate) : new Date();
            const [lmh, lmm, lms] = createdTime.split(":").map(Number);
            lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
            const created = lastModifiedDate.toISOString();
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            const deadlineString = deadlineDate.toISOString();

            const empRes =  await fetch('/api/servicereqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    created: created,
                    deadline: deadlineString,
                    type: type,
                    assigneeId: Number(assigneeId),
                    ownerId: Number(ownerId),
                })
            })
            if (!empRes.ok) {
                setSubmitResult("error");
                return
            }

            setSubmitResult("success")

            resetForm()
        } catch {
            setSubmitResult("error")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-primary text-2xl font-semibold">Add Service Req</DialogTitle>
                </DialogHeader>

                <Separator className="bg-primary" />

                {/* Dates */}
                <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                    {(
                        <>
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
                                        >
                                            {createdDate ? createdDate.toLocaleDateString() : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={createdDate}
                                            defaultMonth={createdDate}
                                            captionLayout="dropdown"
                                            onSelect={(date) => { setCreatedDate(date); setOpenModifiedDate(false); }}
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
                                    value={createdTime}
                                    onChange={(e) => setCreatedTime(e.target.value)}
                                    className="font-normal md:text-sm h-10! appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </Field>

                        </>
                    )}

                    <Field className="bg-background flex-1">
                        <FieldLabel className="text-primary text-lg" htmlFor="date-expiration">
                            Expiration Date
                        </FieldLabel>
                        <Popover open={openExpirationDate} onOpenChange={setOpenExpirationDate}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" id="date-expiration" className="justify-start font-normal text-sm h-10">
                                    {deadline ? deadline.toLocaleDateString() : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={deadline}
                                    defaultMonth={deadline}
                                    captionLayout="dropdown"
                                    onSelect={(date) => { setDeadline(date); setOpenExpirationDate(false); }}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>
                </div>

                <Separator className="bg-primary" />

                <Field>
                    <FieldLabel className="text-primary">Service Request Type</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-background justify-between">
                                {type === "Select service req type" ? "Select service req type" : formatLabel(type)}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={type} onValueChange={setType}>
                                    <DropdownMenuRadioItem value="reviewClaim">Review Claim</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="requestAdjuster">Request Adjuster</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="checkClaim">Check Claim</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Field>

                <Separator className="bg-primary" />

                <div className="flex flex-wrap items-end gap-4">
                    <Field className="flex-1">
                        <FieldLabel className="text-primary" htmlFor="add-assignee">Assignee ID</FieldLabel>
                        <Input
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            id="add-assignee"
                            type="number"
                            placeholder="000000"
                        />
                    </Field>
                    <Field className="flex-2">
                        <FieldLabel className="text-primary" htmlFor="add-owner">Owner ID</FieldLabel>
                        <Input
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                            id="add-owner"
                            type="number"
                            placeholder="000000"
                        />
                    </Field>
                </div>

                {submitResult === "success" && (
                    <div className="rounded-md bg-chart-1 border-chart-2 px-3 py-2">
                        Service Request created successfully!
                    </div>
                )}
                {submitResult === "error" && (
                    <div className="rounded-md bg-destructive border-destructive text-background px-3 py-2">
                        Error creating service req. Please fill in all fields and try again.
                    </div>
                )}

                <div className="flex justify-center pt-2">
                    <Button
                        onClick={handleSubmit}
                        className="bg-accent text-lg text-white hover:bg-accent-dark hover:text-white px-10 py-6"
                        variant="outline"
                        size="lg"
                    >
                        Submit
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}