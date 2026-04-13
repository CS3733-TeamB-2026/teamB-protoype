import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import type { ContentItem } from "@/pages/ViewContent.tsx";
import * as React from "react";

interface Props {
    content: ContentItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ContentItem) => void;
}

export function EditContentDialog({ content, open, onOpenChange, onSave }: Props) {
    const [modified, setModified] = useState<ContentItem>(content);
    const [error, setError] = useState("");
    const [file, setFile] = React.useState<File | null>(null);
    const [uploadMode, setUploadMode] = React.useState<"url" | "file">(
        content.linkURL ? "url" : "file"
    );
    const [user] = useUser();

    const [expired, setExpired] = useState(false);

    {/*This is the thing that kicks the user out if editing time is up*/}
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(async () => {
            const res = await fetch(`/api/content/${content.id}`, {
                cache: "no-store"
            });
            const data = await res.json();
            if (String(data.checkedOutBy) !== String(user!.id)) {
                setExpired(true);
                setTimeout(() => onOpenChange(false), 2000);
                return;
            }
        }, 5 * 1000);
        return () => clearInterval(interval);
    }, [open, content.id, onOpenChange, user]);


    async function handleApply() {
        setExpired(false);
        if (
            !modified.displayName.trim() ||
            !modified.contentType.trim() ||
            !modified.targetPersona.trim() ||
            (uploadMode === "url" && !modified.linkURL?.trim())
        ) {
            setError("Fields may not be empty.");
            return;
        }
        setError("");

        const formData = new FormData();
        formData.append("id", modified.id.toString());
        formData.append("name", modified.displayName);
        formData.append("linkURL", uploadMode === "url" ? (modified.linkURL ?? "") : "");
        formData.append("ownerID", modified.ownerID ? modified.ownerID.toString() : "");
        formData.append("contentType", modified.contentType);
        formData.append("status", modified.status ?? "");
        formData.append("expiration", modified.expiration ?? "");
        formData.append("targetPersona", modified.targetPersona);
        formData.append("employeeID", String(user!.id));

        if (uploadMode === "file" && file) {
            formData.append("file", file);
        }

        const contentRes = await fetch("/api/content", {
            method: "PUT",
            body: formData
        });

        if (contentRes.ok) {
            const updated = await contentRes.json();
            onSave(updated);
            onOpenChange(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={async (nextOpen) => {
                if (!nextOpen && user && !expired) {
                    await fetch("/api/content/checkin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: content.id,
                            employeeID: user.id,
                        }),
                    });
                }
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify Content</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify a piece of content.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
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
                        <Label className="my-2">Content Source</Label>
                        <RadioGroup
                            value={uploadMode}
                            onValueChange={(v) => setUploadMode(v as "url" | "file")}
                            className="flex gap-4 mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="url" id="edit-mode-url" />
                                <Label htmlFor="edit-mode-url">URL</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="file" id="edit-mode-file" />
                                <Label htmlFor="edit-mode-file">File Upload</Label>
                            </div>
                        </RadioGroup>
                        {uploadMode === "url" ? (
                            <Input
                                defaultValue={content.linkURL ?? ""}
                                className="bg-secondary"
                                placeholder="Enter Link URL"
                                onChange={(e) => setModified((prev) => ({ ...prev, linkURL: e.target.value }))}
                            />
                        ) : (
                            <Input
                                type="file"
                                className="bg-secondary"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        )}
                    </div>
                    <div>
                        <Label className="my-2">Owner ID</Label>
                        <Input
                            defaultValue={content.ownerID ?? undefined}
                            type="number"
                            className="bg-secondary"
                            placeholder="Enter Owner ID"
                            onChange={(e) => setModified((prev) => ({ ...prev, ownerID: parseInt(e.target.value) }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Job Position</Label>
                        <Select
                            defaultValue={content.targetPersona}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, targetPersona: value as ContentItem["targetPersona"] }))}
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
                    <div>
                        <Label className="my-2">Expiration</Label>
                        <Input
                            defaultValue={content.expiration ?? undefined}
                            type="date"
                            className="bg-secondary"
                            placeholder="Enter Expiration Date"
                            onChange={(e) => setModified((prev) => ({ ...prev, expiration: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label className="my-2">Type</Label>
                        <Select
                            defaultValue={content.contentType}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, contentType: value as ContentItem["contentType"] }))}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="workflow">Workflow</SelectItem>
                                <SelectItem value="reference">Reference</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="my-2">Status</Label>
                        <Select
                            defaultValue={content.status ?? undefined}
                            onValueChange={(value) => setModified((prev) => ({ ...prev, status: value as ContentItem["status"] }))}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="inProgress">In Progress</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {expired && (
                        <div className="rounded-md bg-destructive text-background px-2 py-1 text-sm text-center">
                            Your editing time has expired, please try again.
                        </div>
                    )}
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
