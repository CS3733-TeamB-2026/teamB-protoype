import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary text-center">Modify User</DialogTitle>
                    <DialogDescription className="text-muted-foreground mb-2 text-center">
                        Modify user values here.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>

                <div className="flex flex-col gap-3 mx-2">
                    <Field>
                        <FieldLabel className="text-primary text-lg">Employee ID</FieldLabel>
                        <Input value={content.id} className="h-8 text-sm!" disabled />
                    </Field>

                    <Separator className="bg-primary my-1" />

                    <div className="flex gap-4">
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg">
                                First Name <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={modified.firstName}
                                className="h-8 text-sm!"
                                placeholder="Enter first name"
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
                            {errors.firstName && <FieldDescription className="text-destructive">{errors.firstName}</FieldDescription>}
                        </Field>
                        <Field className="flex-1">
                            <FieldLabel className="text-primary text-lg">
                                Last Name <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={modified.lastName}
                                className="h-8 text-sm!"
                                placeholder="Enter last name"
                                onChange={(e) => {
                                    const last = e.target.value;
                                    setModified((prev) => ({ ...prev, lastName: last }));
                                    setErrors((prev) => ({
                                        ...prev,
                                        lastName: checkNameTaken(modified.firstName, last),
                                    }));
                                }}
                            />
                            {errors.lastName && <FieldDescription className="text-destructive">{errors.lastName}</FieldDescription>}
                        </Field>
                    </div>

                    <Separator className="bg-primary my-1" />

                    <Field>
                        <FieldLabel className="text-primary text-lg">Job Position</FieldLabel>
                        <Select
                            value={modified.persona}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, persona: value as Employee["persona"] }))}
                        >
                            <SelectTrigger className="h-8 text-sm!">
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
                    </Field>
                </div>

                <DialogFooter>
                    <div className="flex flex-col items-center gap-4 w-full">
                        <Separator />
                        <Button
                            className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                            disabled={submitting}
                            onClick={handleApply}
                        >
                            {submitting ? "Saving..." : "Apply"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}