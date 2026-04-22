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
import type { ServiceReq } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

interface Props {
    content: ServiceReq;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ServiceReq) => void;
}

export function EditServiceReqDialog({ content, open, onOpenChange, onSave }: Props) {
    const [modified, setModified] = useState<ServiceReq>(content);
    const { getAccessTokenSilently } = useAuth0();

    async function handleApply() {
        if (!modified.created.trim() || !modified.deadline.trim() || !modified.type.trim() || !modified.assignee || !modified.owner) {
            toast.error("Fields may not be empty.");
            return;
        }

        const token = await getAccessTokenSilently();
        const empRes = await fetch("/api/servicereqs", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                id: modified.id,
                created: modified.created.trim(),
                deadline: modified.deadline.trim(),
                type: modified.type.trim(),
                assignee: modified.assignee,
                owner: modified.owner,
            }),
        });

        if (empRes.ok) {
            onSave(modified);
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify ServiceReq</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify service req values here.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <div>
                        <Label className="my-2">Created</Label>
                        <Input
                            defaultValue={content.created}
                            className="bg-secondary"
                            placeholder="Enter Service Req created date"
                            onChange={(s) => setModified((prev) => ({ ...prev, created: s.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Deadline</Label>
                        <Input
                            defaultValue={content.deadline}
                            className="bg-secondary"
                            placeholder="Enter Service Req Deadline"
                            onChange={(s) => setModified((prev) => ({ ...prev, deadline: s.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Type</Label>
                        <Select
                            defaultValue={content.type}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, type: value }))}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reviewClaim">Review Claim</SelectItem>
                                <SelectItem value="requestAdjuster">Request Adjuster</SelectItem>
                                <SelectItem value="checkClaim">Check Claim</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="my-2">Assignee ID</Label>
                        <Input
                            defaultValue={content.assignee}
                            className="bg-secondary"
                            placeholder="Enter Service Req Assignee ID"
                            onChange={(s) => setModified((prev) => ({ ...prev, assignee: Number(s.target.value) }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Owner ID</Label>
                        <Input
                            defaultValue={content.owner}
                            className="bg-secondary"
                            placeholder="Enter Service Req Owner ID"
                            onChange={(s) => setModified((prev) => ({ ...prev, owner: Number(s.target.value) }))}
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
