"use client"
import { ChevronDown } from "lucide-react"
import * as React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent, DialogDescription, DialogFooter,
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
import type { Employee } from "@/lib/types.ts"
import { toast } from "sonner";

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (created: Employee) => void
}

export function AddEmployeeDialog({ open, onOpenChange, onSave }: AddEmployeeDialogProps) {
    const [targetPersona, setTargetPersona] = useState("Select job position")
    const [firstName, setFirstName] = React.useState("")
    const [lastName, setLastName] = React.useState("")
    const [userName, setUserName] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [id, setID] = React.useState("")
    const [submitResult, setSubmitResult] = useState<"success" | "error" | "mismatch" | null>(null)
    const { getAccessTokenSilently } = useAuth0()

    const resetForm = () => {
        setTargetPersona("Select job position")
        setFirstName("")
        setLastName("")
        setUserName("")
        setPassword("")
        setConfirmPassword("")
        setEmail("")
        setID("")
        setSubmitResult(null)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        {/*TODO: This forces the user to enter all the fields, should probably do this on backend later */}
        if (!firstName || !lastName || !id || !userName || !password || targetPersona === "Select job position") {
            toast.error("Please fill out all fields.");
            return
        }
        if (password !== confirmPassword) {
            toast.error("Password fields must match.");
            return
        }
        try {
            const token = await getAccessTokenSilently();
            const empRes =  await fetch('/api/employee/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    id: parseInt(id),
                    persona: targetPersona,
                    username: userName,
                    email: email,
                    password: password,
                })
            })
            if (!empRes.ok) {
                toast.error("Error employee user.");
                return
            }

            toast.success("Employee user created successfully!");

            onSave({
                firstName: firstName,
                lastName: lastName,
                id: parseInt(id),
                persona: targetPersona,
                profilePhotoURI: ""
            })

            setTargetPersona("Select job position")
            setFirstName("")
            setLastName("")
            setUserName("")
            setPassword("")
            setConfirmPassword("")
            setEmail("")
            setID("")

        } catch {
            toast.error("Error creating employee user.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">

                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary text-center">Add Employee</DialogTitle>
                    <DialogDescription className="text-muted-foreground mb-2 text-center">
                        Add a new employee with associated user.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>

                <div className="overflow-y-auto flex-1 flex flex-col gap-2 min-w-0 pr-2 mx-2">

                    <div className="flex flex-wrap items-end gap-4">
                        <Field className="flex-2">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-first-name">First Name</FieldLabel>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                id="add-first-name"
                                type="text"
                                placeholder="Enter first name"
                                className="h-8 text-sm!"
                            />
                        </Field>
                        <Field className="flex-2">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-last-name">Last Name</FieldLabel>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                id="add-last-name"
                                type="text"
                                placeholder="Enter last name"
                                className="h-8 text-sm!"
                            />
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-employee-id">
                                ID</FieldLabel>
                            <Input
                                value={id}
                                onChange={(e) => setID(e.target.value)}
                                id="add-employee-id"
                                type="number"
                                placeholder="000000"
                                className="h-8 text-sm!"
                            />
                        </Field>
                    </div>

                    <Separator className="bg-primary my-3" />

                    <Field>
                        <FieldLabel className="text-primary text-lg">Job Position</FieldLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-background justify-between h-8 text-sm">
                                    {targetPersona === "Select job position" ? "Select job position" : formatLabel(targetPersona)}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={targetPersona} onValueChange={setTargetPersona}>
                                        <DropdownMenuRadioItem value="underwriter">Underwriter</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="businessAnalyst">Business Analyst</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="actuarialAnalyst">Actuarial Analyst</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="EXLOperator">EXL Operations</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="businessOps">Business Operator</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Field>

                    <Separator className="bg-primary my-3" />

                    <div className="flex flex-wrap gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-username">Username</FieldLabel>
                            <Input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                id="add-username"
                                type="text"
                                placeholder="Enter username"
                                className="h-8 text-sm!"
                            />
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-email">Email</FieldLabel>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                id="add-email"
                                type="email"
                                placeholder="Enter email"
                                className="h-8 text-sm!"
                            />
                        </Field>
                    </div>
                    <div />
                    <div className="flex flex-wrap items-end gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-password">Password</FieldLabel>
                            <Input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="add-password"
                                type="password"
                                placeholder="Enter password"
                                className="h-8 text-sm!"
                            />
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-password">Confirm Password</FieldLabel>
                            <Input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                id="add-password"
                                type="password"
                                placeholder="Enter password again"
                                className="h-8 text-sm!"
                            />
                        </Field>
                    </div>

                    {submitResult === "success" && (
                        <div className="rounded-md bg-chart-1 border-chart-2 px-3 py-2">
                            Employee created successfully!
                        </div>
                    )}
                    {submitResult === "error" && (
                        <div className="rounded-md bg-destructive border-destructive text-background px-3 py-2">
                            Error creating employee. Please fill in all fields and try again.
                        </div>
                    )}
                    {submitResult === "mismatch" && (
                        <div className="rounded-md bg-destructive border-destructive text-background px-3 py-2">
                            Passwords do not match.
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-0 w-full">
                        <Separator />
                        <div className="flex flex-row gap-2">
                            <Button variant="outline" onClick={resetForm}>
                                Reset
                            </Button>
                            <Button
                                className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                onClick={handleSubmit}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}