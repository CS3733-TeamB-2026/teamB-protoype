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

interface AddServiceReqDialog {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (created: ServiceReq) => void
}

export function AddServiceReqDialog({ open, onOpenChange, onSave }: AddServiceReqDialog) {
    const [type, setType] = useState("Select service req type")
    const [created, setCreated] = React.useState("")
    const [deadline, setDeadline] = React.useState("")
    const [assignee, setAssignee] = React.useState("")
    const [owner, setOwner] = React.useState("")
    const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)
    const { getAccessTokenSilently } = useAuth0()

    const resetForm = () => {
        setType("Select service req type")
        setCreated("")
        setDeadline("")
        setAssignee("")
        setOwner("")
        setSubmitResult(null)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        {/*TODO: This forces the user to enter all the fields, should probably do this on backend later */}
        if (!created || !deadline || !owner || !assignee || type === "Select service req type") {
            setSubmitResult("error")
            return
        }
        try {
            const token = await getAccessTokenSilently();
            const empRes =  await fetch('/api/servicereqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    created: created,
                    deadline: deadline,
                    type: type,
                    assignee: assignee,
                    owner: owner,
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

                <div className="flex flex-wrap items-end gap-4">
                    <Field className="flex-2">
                        <FieldLabel className="text-primary" htmlFor="add-created">Created</FieldLabel>
                        <Input
                            value={created}
                            onChange={(e) => setCreated(e.target.value)}
                            id="add-created"
                            type="text"
                            placeholder="Enter created date"
                        />
                    </Field>
                    <Field className="flex-2">
                        <FieldLabel className="text-primary" htmlFor="add-deadline">Deadline</FieldLabel>
                        <Input
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            id="add-deadline"
                            type="text"
                            placeholder="Enter deadline date"
                        />
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
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            id="add-assignee"
                            type="text"
                            placeholder="Enter assignee id"
                        />
                    </Field>
                    <Field className="flex-2">
                        <FieldLabel className="text-primary" htmlFor="add-owner">Owner ID</FieldLabel>
                        <Input
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            id="add-owner"
                            type="text"
                            placeholder="Enter owner id"
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