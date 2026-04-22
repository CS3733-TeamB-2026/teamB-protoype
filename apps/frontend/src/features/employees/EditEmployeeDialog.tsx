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
import type { Employee, Persona } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

interface Props {
    content: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: Employee) => void;
}

export function EditEmployeeDialog({ content, open, onOpenChange, onSave }: Props) {
    const [modified, setModified] = useState<Employee>(content);
    const { getAccessTokenSilently } = useAuth0();

    async function handleApply() {
        if (!modified.firstName.trim() || !modified.lastName.trim() || !modified.persona.trim()) {
            toast.error("Fields may not be empty.");
            return;
        }

        const token = await getAccessTokenSilently();
        const empRes = await fetch("/api/employee", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                id: modified.id,
                firstName: modified.firstName,
                lastName: modified.lastName,
                persona: modified.persona,
            }),
        });

        if (modified.login?.userName) {
            const token = await getAccessTokenSilently();
            await fetch("/api/login", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userName: modified.login.userName,
                    employeeID: modified.id,
                }),
            });
        }

        if (empRes.ok) {
            onSave(modified);
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify User</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify user values here.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <div>
                        <Label className="my-2">Employee ID</Label>
                        <Input defaultValue={content.id} className="bg-secondary" disabled />
                    </div>
                    <div>
                        <Label className="my-2">First Name</Label>
                        <Input
                            defaultValue={content.firstName}
                            className="bg-secondary"
                            placeholder="Enter Employee First Name"
                            onChange={(e) => setModified((prev) => ({ ...prev, firstName: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Last Name</Label>
                        <Input
                            defaultValue={content.lastName}
                            className="bg-secondary"
                            placeholder="Enter Employee Last Name"
                            onChange={(e) => setModified((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Persona</Label>
                        <Select
                            defaultValue={content.persona}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, persona: value as Persona }))}
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
                    <div>
                        <Label className="my-2">Username</Label>
                        <Input
                            disabled
                            defaultValue={content.login?.userName}
                            className="bg-secondary"
                            placeholder="Enter Employee Username"
                            onChange={(e) =>
                                setModified((prev) => ({
                                    ...prev,
                                    login: { ...prev.login, userName: e.target.value },
                                }))
                            }
                        />
                    </div>
                    <Button
                        className="mt-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-20 mx-auto rounded-lg px-2 py-1"
                        onClick={handleApply}
                    >
                        Apply
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
