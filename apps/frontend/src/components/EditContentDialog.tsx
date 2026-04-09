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

    async function handleApply() {
        if (!modified.displayName.trim()
            || !modified.contentType.trim()
            || !modified.targetPersona.trim()
            || (content.fileURI == null && modified.linkURL == null)
        ) {
            setError("Fields may not be empty.");
            return;
        }
        setError("");

        const formData = new FormData();
        formData.append("id", modified.id.toString());
        formData.append("name", modified.displayName);
        formData.append("linkURL", modified.linkURL ?? "");
        formData.append("ownerID", modified.ownerID ? modified.ownerID.toString() : "");
        formData.append("contentType", modified.contentType);
        formData.append("status", modified.status ?? "");
        formData.append("expiration", modified.expiration ?? "");
        formData.append("targetPersona", modified.targetPersona);

        if (content.fileURI && file) {
            formData.append("file", file);
        }

        const contentRes = await fetch("/api/content", {
            method: "PUT",
            body: formData
        });

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
                    {/*Only show the field that exists between URL and URI
                        need weird nested ternary to prevent TS yelling about null values
                        TODO change null catchers to use ?? syntax*/}
                    {content.linkURL ? (
                    <div>
                        <Label className="my-2">URL</Label>
                        <Input
                            defaultValue={content.linkURL}
                            className="bg-secondary"
                            placeholder="Enter Link URL"
                            onChange={(e) => setModified((prev) => ({ ...prev, linkURL: e.target.value }))}
                        />
                    </div>
                    ): ( content.fileURI ? (
                        <div>
                            <Label className="my-2">Upload File</Label>
                            <Input
                                type="file"
                                className="bg-secondary"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                    ):
                        <div>ERROR</div>
                        )

                    }
                    {/*TODO make it throw an error instead of showing nothing if there is neither a link or a file*/}
                    {content.ownerID ? (
                        <div>
                            <Label className="my-2">Owner ID</Label>
                            <Input
                                defaultValue={content.ownerID}
                                type="number"
                                className="bg-secondary"
                                placeholder="Enter Owner ID"
                                onChange={(e) => setModified((prev) => ({ ...prev, ownerID: parseInt(e.target.value) }))}
                            />
                        </div>
                    ) : (
                        <div>
                            <Label className="my-2">Owner ID</Label>
                            <Input
                                type="number"
                                className="bg-secondary"
                                placeholder="Enter Owner ID"
                                onChange={(e) => setModified((prev) => ({ ...prev, ownerID: parseInt(e.target.value) }))}
                            />
                        </div>
                    )
                    }
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
                    { content.expiration? (
                        <div>
                            <Label className="my-2">Expiration</Label>
                            <Input
                                defaultValue={content.expiration}
                                type="date"
                                className="bg-secondary"
                                placeholder="Enter Expiration Date"
                                onChange={(e) => setModified((prev) => ({ ...prev, expiration: e.target.value }))}
                            />
                        </div>
                    ): (
                        <div>
                            <Label className="my-2">Expiration</Label>
                            <Input
                                type="date"
                                className="bg-secondary"
                                placeholder="Enter Expiration Date"
                                onChange={(e) => setModified((prev) => ({ ...prev, expiration: e.target.value }))}
                            />
                        </div>
                    )
                    }
                    {/*TODO make this use the same datepicker UI as the other stuff*/}
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
                    { content.status? (
                        <div>
                            <Label className="my-2">Status</Label>
                            <Select
                                defaultValue={content.status}
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
                    ) : (
                        <div>
                            <Label className="my-2">Status</Label>
                            <Select
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
                    )

                    }
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
