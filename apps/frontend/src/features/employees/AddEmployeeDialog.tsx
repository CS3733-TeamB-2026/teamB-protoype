"use client"
import { ChevronDown } from "lucide-react"
import * as React from "react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent, DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx"
import {
    Field,
    FieldLabel,
    FieldDescription,
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
import type { Employee, Persona } from "@/lib/types.ts"
import { toast } from "sonner";
import { useEmployeeNameTaken } from "./use-employee-name-taken";

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (created: Employee) => void
}

function lowestAvailableId(taken: Set<number>): number {
    let n = 1;
    while (taken.has(n)) n++;
    return n;
}

function validateId(value: string, taken: Set<number>): string {
    if (!value) return "ID is required.";
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) return "Must be a positive whole number.";
    if (taken.has(n)) return "This ID is already in use.";
    return "";
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
    const [takenIds, setTakenIds] = useState<Set<number>>(new Set())
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { getAccessTokenSilently } = useAuth0()
    const checkNameTaken = useEmployeeNameTaken(open);

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/employee", { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return;
                const employees: Employee[] = await res.json();
                const taken = new Set(employees.map(e => e.id));
                setTakenIds(taken);
                setID(String(lowestAvailableId(taken)));
                setErrors(prev => ({ ...prev, id: "" }));
            } catch {
                // non-fatal — user can still type manually
            }
        })();
    }, [open, getAccessTokenSilently]);

    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        setErrors(p => ({ ...p, firstName: "", lastName: checkNameTaken(value, lastName) }));
    };

    const handleLastNameChange = (value: string) => {
        setLastName(value);
        setErrors(p => ({ ...p, lastName: checkNameTaken(firstName, value) }));
    };

    const handleIdChange = (value: string) => {
        setID(value);
        const err = validateId(value, takenIds);
        setErrors(prev => ({ ...prev, id: err }));
    };

    const resetForm = () => {
        setTargetPersona("Select job position")
        setFirstName("")
        setLastName("")
        setUserName("")
        setPassword("")
        setConfirmPassword("")
        setEmail("")
        setID("")
        setErrors({})
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = "First name is required.";
        const nameErr = checkNameTaken(firstName, lastName);
        if (!lastName.trim()) newErrors.lastName = "Last name is required.";
        else if (nameErr) newErrors.lastName = nameErr;
        const idErr = validateId(id, takenIds);
        if (idErr) newErrors.id = idErr;
        if (targetPersona === "Select job position") newErrors.persona = "Job position is required.";
        if (!userName.trim()) newErrors.userName = "Username is required.";
        if (!email.trim()) newErrors.email = "Email is required.";
        if (!password) newErrors.password = "Password is required.";
        if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
        else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            const empRes = await fetch('/api/employee/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    id: parseInt(id),
                    persona: targetPersona,
                    username: userName,
                    email,
                    password,
                })
            })
            if (!empRes.ok) {
                toast.error("Failed to create employee.");
                return
            }

            toast.success("Employee created successfully!");
            onOpenChange(false);
            onSave({
                firstName,
                lastName,
                id: parseInt(id),
                persona: targetPersona as Persona,
                profilePhotoURI: ""
            })
        } catch {
            toast.error("Error creating employee.");
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

                    <div className="flex flex-wrap items-start gap-4">
                        <div className="flex flex-wrap flex-2 gap-4 flex-col min-w-0">
                            <div className="flex flex-wrap gap-4">
                                <Field className="flex-2">
                                    <FieldLabel className="text-primary text-lg" htmlFor="add-first-name">
                                        First Name <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => handleFirstNameChange(e.target.value)}
                                        id="add-first-name"
                                        type="text"
                                        placeholder="Enter first name"
                                        className="h-8 text-sm!"
                                    />
                                    {errors.firstName && <FieldDescription className="text-destructive">{errors.firstName}</FieldDescription>}
                                </Field>
                                <Field className="flex-2">
                                    <FieldLabel className="text-primary text-lg" htmlFor="add-last-name">
                                        Last Name <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => handleLastNameChange(e.target.value)}
                                        id="add-last-name"
                                        type="text"
                                        placeholder="Enter last name"
                                        className="h-8 text-sm!"
                                    />
                                </Field>
                            </div>
                            {errors.lastName && <FieldDescription className="text-destructive">{errors.lastName}</FieldDescription>}
                        </div>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-employee-id">
                                ID <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={id}
                                onChange={(e) => handleIdChange(e.target.value)}
                                id="add-employee-id"
                                type="number"
                                placeholder="000000"
                                className="h-8 text-sm!"
                            />
                            {errors.id && <FieldDescription className="text-destructive">{errors.id}</FieldDescription>}
                        </Field>
                    </div>

                    <Separator className="bg-primary my-3" />

                    <Field>
                        <FieldLabel className="text-primary text-lg">
                            Job Position <span className="text-destructive">*</span>
                        </FieldLabel>
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
                                    <DropdownMenuRadioGroup value={targetPersona} onValueChange={(v) => { setTargetPersona(v); setErrors(p => ({ ...p, persona: "" })); }}>
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
                        {errors.persona && <FieldDescription className="text-destructive">{errors.persona}</FieldDescription>}
                    </Field>

                    <Separator className="bg-primary my-3" />

                    <div className="flex flex-wrap gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-username">
                                Username <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={userName}
                                onChange={(e) => { setUserName(e.target.value); setErrors(p => ({ ...p, userName: "" })); }}
                                id="add-username"
                                type="text"
                                placeholder="Enter username"
                                className="h-8 text-sm!"
                            />
                            {errors.userName && <FieldDescription className="text-destructive">{errors.userName}</FieldDescription>}
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-email">
                                Email <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                                id="add-email"
                                type="email"
                                placeholder="Enter email"
                                className="h-8 text-sm!"
                            />
                            {errors.email && <FieldDescription className="text-destructive">{errors.email}</FieldDescription>}
                        </Field>
                    </div>
                    <div />
                    <div className="flex flex-wrap items-start gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-password">
                                Password <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                                id="add-password"
                                type="password"
                                placeholder="Enter password"
                                className="h-8 text-sm!"
                            />
                            {errors.password && <FieldDescription className="text-destructive">{errors.password}</FieldDescription>}
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-confirm-password">
                                Confirm Password <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                                id="add-confirm-password"
                                type="password"
                                placeholder="Enter password again"
                                className="h-8 text-sm!"
                            />
                            {errors.confirmPassword && <FieldDescription className="text-destructive">{errors.confirmPassword}</FieldDescription>}
                        </Field>
                    </div>

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
