import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import type { Employee } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { useEmployeeNameTaken } from "./use-employee-name-taken";

interface Props {
    content: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: Employee) => void;
}

type FormErrors = { firstName?: string; lastName?: string };

export function EditEmployeeDialog({ content, open, onOpenChange, onSave }: Props) {
    const [modified, setModified] = useState<Employee>(content);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const checkNameTaken = useEmployeeNameTaken(open, content.id);

    function validate(): FormErrors {
        const errs: FormErrors = {};
        if (!modified.firstName.trim()) errs.firstName = "First name is required.";
        if (!modified.lastName.trim()) errs.lastName = "Last name is required.";
        else {
            const nameErr = checkNameTaken(modified.firstName, modified.lastName);
            if (nameErr) errs.lastName = nameErr;
        }
        return errs;
    }

    async function handleApply() {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/employee", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: modified.id,
                    firstName: modified.firstName,
                    lastName: modified.lastName,
                    persona: modified.persona,
                }),
            });

            if (!res.ok) {
                toast.error("Failed to save changes.");
                return;
            }

            onSave(modified);
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose(o: boolean) {
        if (!o) {
            setModified(content);
            setErrors({});
        }
        onOpenChange(o);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify User</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify user values here.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    <div>
                        <Label className="my-2">Employee ID</Label>
                        <Input value={content.id} className="bg-secondary" disabled />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>First Name <span className="text-destructive">*</span></Label>
                        <Input
                            value={modified.firstName}
                            className="bg-secondary"
                            placeholder="Enter Employee First Name"
                            onChange={(e) => {
                                const first = e.target.value;
                                setModified((prev) => ({ ...prev, firstName: first }));
                                setErrors((prev) => ({
                                    ...prev,
                                    firstName: "",
                                    lastName: checkNameTaken(first, modified.lastName),
                                }));
                            }}
                        />
                        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Last Name <span className="text-destructive">*</span></Label>
                        <Input
                            value={modified.lastName}
                            className="bg-secondary"
                            placeholder="Enter Employee Last Name"
                            onChange={(e) => {
                                const last = e.target.value;
                                setModified((prev) => ({ ...prev, lastName: last }));
                                setErrors((prev) => ({
                                    ...prev,
                                    lastName: checkNameTaken(modified.firstName, last),
                                }));
                            }}
                        />
                        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                    <div>
                        <Label className="my-2">Persona</Label>
                        <Select
                            value={modified.persona}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, persona: value as Employee["persona"] }))}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select Persona" />
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
                    </div>
                    <Button
                        className="mt-2 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-20 mx-auto rounded-lg px-2 py-1"
                        disabled={submitting}
                        onClick={handleApply}
                    >
                        {submitting ? "Saving..." : "Apply"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}