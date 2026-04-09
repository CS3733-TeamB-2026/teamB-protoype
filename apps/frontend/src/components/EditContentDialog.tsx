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
import type { ContentItem } from "@/components/ViewContent";

interface Props {
    content: ContentItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ContentItem) => void;
}

export function EditContentDialog({ content, open, onOpenChange, onSave }: Props) {
    const [modified, setModified] = useState<ContentItem>(content);
    const [error, setError] = useState("");

    async function handleApply() {
        if (!modified.displayName.trim()
            || !modified.contentType.trim()
            || !modified.targetPersona.trim()
            || (modified.fileURI == null && modified.linkURL == null)
        ) {
            setError("Fields may not be empty.");
            return;
        }
        setError("");

        const contentRes = await fetch("/api/content", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: modified.displayName,
                linkURL: modified.linkURL,
                fileURI: modified.fileURI,
                ownerID: modified.ownerID,
                contentType: modified.contentType,
                status: modified.status,
                lastModified: modified.lastModified,
                expiration: modified.expiration,
                targetPersona: modified.targetPersona,
            }),
        });

        /*if (modified.login?.userName) {
            await fetch("/api/login", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName: modified.login.userName,
                    employeeID: modified.id,
                }),
            });
        }*/
        //TODO do something like this for Supabase bucket

        if (contentRes.ok) {
            onSave(modified);
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify Content</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify a piece of content.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    /*
                    <div>
                        <Label className="my-2">Content ID</Label>
                        <Input defaultValue={content.id} className="bg-secondary" disabled />
                    </div>
                    <div>
                        <Label className="my-2">Name</Label>
                        <Input
                            defaultValue={content.displayName}
                            className="bg-secondary"
                            placeholder="Enter Content Name"
                            onChange={(e) => setModified((prev) => ({ ...prev, displayName: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Persona</Label>
                        <Select
                            defaultValue={content.targetPersona}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, persona: value }))}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select Persona" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="underwriter">Underwriter</SelectItem>
                                <SelectItem value="businessAnalyst">Business Analyst</SelectItem>
                            </SelectContent>
                        </Select>
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
