import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent, DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useAuth0 } from "@auth0/auth0-react";
import { formatLabel } from "@/lib/utils.ts";
import type { Employee } from "@/lib/types.ts";
import { toast } from "sonner";
import { useEmployeeNameTaken } from "./use-employee-name-taken";
import {
    type EmployeeFormValues,
    initialValues,
    getErrors,
    buildPayload,
    toEmployee,
    lowestAvailableId,
} from "./employee-form";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (created: Employee) => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSave }: Props) {
    const [values, setValues] = useState<EmployeeFormValues>(initialValues);
    const [takenIds, setTakenIds] = useState<Set<number>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingIds, setLoadingIds] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const checkNameTaken = useEmployeeNameTaken(open);

    useEffect(() => {
        if (!open) return;
        setLoadingIds(true);
        (async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/employee", { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return;
                const employees: Employee[] = await res.json();
                const taken = new Set(employees.map(e => e.id));
                setTakenIds(taken);
                setValues(prev => ({ ...prev, id: String(lowestAvailableId(taken)) }));
                setErrors(prev => ({ ...prev, id: "" }));
            } catch {
                // non-fatal — user can still type manually
            } finally {
                setLoadingIds(false);
            }
        })();
    }, [open, getAccessTokenSilently]);

    function set<K extends keyof EmployeeFormValues>(field: K, value: EmployeeFormValues[K]) {
        setValues(prev => ({ ...prev, [field]: value }));
    }

    function clearError(field: string) {
        setErrors(prev => ({ ...prev, [field]: "" }));
    }

    const resetForm = () => {
        setValues(initialValues(takenIds.size > 0 ? takenIds : undefined));
        setErrors({});
    };

    const handleOpenChange = (next: boolean) => {
        if (submitting) return;
        if (!next) resetForm();
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        const errs = getErrors(values, takenIds, checkNameTaken);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/employee/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(buildPayload(values)),
            });
            if (!res.ok) {
                toast.error("Failed to create employee.");
                return;
            }
            toast.success("Employee created successfully!");
            onSave(toEmployee(values));
            onOpenChange(false);
        } catch {
            toast.error("Error creating employee.");
        } finally {
            setSubmitting(false);
        }
    };

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
                                        id="add-first-name"
                                        value={values.firstName}
                                        placeholder="Enter first name"
                                        className="h-8 text-sm!"
                                        onChange={(e) => {
                                            const first = e.target.value;
                                            set("firstName", first);
                                            setErrors(prev => ({ ...prev, firstName: "", lastName: checkNameTaken(first, values.lastName) }));
                                        }}
                                    />
                                    {errors.firstName && <FieldDescription className="text-destructive">{errors.firstName}</FieldDescription>}
                                </Field>
                                <Field className="flex-2">
                                    <FieldLabel className="text-primary text-lg" htmlFor="add-last-name">
                                        Last Name <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        id="add-last-name"
                                        value={values.lastName}
                                        placeholder="Enter last name"
                                        className="h-8 text-sm!"
                                        onChange={(e) => {
                                            const last = e.target.value;
                                            set("lastName", last);
                                            setErrors(prev => ({ ...prev, lastName: checkNameTaken(values.firstName, last) }));
                                        }}
                                    />
                                </Field>
                            </div>
                            {errors.lastName && <FieldDescription className="text-destructive">{errors.lastName}</FieldDescription>}
                        </div>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-employee-id">
                                ID <span className="text-destructive">*</span>
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="add-employee-id"
                                    type="number"
                                    value={values.id}
                                    placeholder="000000"
                                    className="h-8 text-sm!"
                                    disabled={loadingIds}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        set("id", v);
                                        const n = Number(v);
                                        if (!v) clearError("id");
                                        else if (!Number.isInteger(n) || n < 1) setErrors(prev => ({ ...prev, id: "Must be a positive whole number." }));
                                        else if (takenIds.has(n)) setErrors(prev => ({ ...prev, id: "This ID is already in use." }));
                                        else clearError("id");
                                    }}
                                />
                                {loadingIds && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                            </div>
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
                                    {values.persona ? formatLabel(values.persona) : "Select job position"}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={values.persona}
                                        onValueChange={(v) => { set("persona", v); clearError("persona"); }}
                                    >
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
                                id="add-username"
                                value={values.username}
                                placeholder="Enter username"
                                className="h-8 text-sm!"
                                onChange={(e) => { set("username", e.target.value); clearError("username"); }}
                            />
                            {errors.username && <FieldDescription className="text-destructive">{errors.username}</FieldDescription>}
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-email">
                                Email <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="add-email"
                                type="email"
                                value={values.email}
                                placeholder="Enter email"
                                className="h-8 text-sm!"
                                onChange={(e) => { set("email", e.target.value); clearError("email"); }}
                            />
                            {errors.email && <FieldDescription className="text-destructive">{errors.email}</FieldDescription>}
                        </Field>
                    </div>

                    <div className="flex flex-wrap items-start gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-password">
                                Password <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="add-password"
                                type="password"
                                value={values.password}
                                placeholder="Enter password"
                                className="h-8 text-sm!"
                                onChange={(e) => { set("password", e.target.value); clearError("password"); }}
                            />
                            {errors.password && <FieldDescription className="text-destructive">{errors.password}</FieldDescription>}
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg" htmlFor="add-confirm-password">
                                Confirm Password <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="add-confirm-password"
                                type="password"
                                value={values.confirmPassword}
                                placeholder="Enter password again"
                                className="h-8 text-sm!"
                                onChange={(e) => { set("confirmPassword", e.target.value); clearError("confirmPassword"); }}
                            />
                            {errors.confirmPassword && <FieldDescription className="text-destructive">{errors.confirmPassword}</FieldDescription>}
                        </Field>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-0 w-full">
                        <Separator />
                        <div className="flex flex-row gap-2">
                            <Button variant="outline" disabled={submitting} onClick={resetForm}>
                                Reset
                            </Button>
                            <Button
                                className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}