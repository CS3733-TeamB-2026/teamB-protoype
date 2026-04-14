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
import { Separator } from "@/components/ui/separator.tsx";
import { toast } from "sonner";
import { ContentFormFields } from "@/components/shared/ContentFormFields.tsx";
import { type ContentFormValues, fromContentItem, getErrors } from "@/lib/content-form.ts";
import type { ContentItem } from "@/pages/ViewContent.tsx";

interface Props {
    content: ContentItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ContentItem) => void;
}

export function EditContentDialog({ content, open, onOpenChange, onSave }: Props) {
    const [values, setValues] = useState<ContentFormValues>(() => fromContentItem(content));
    const patch = (p: Partial<ContentFormValues>) => setValues(prev => ({ ...prev, ...p }));

    const [submitted, setSubmitted] = useState(false);
    const errors = submitted ? getErrors(values) : {};

    const [expired, setExpired] = useState(false);
    const [user] = useUser();

    // Kick the user out if the checkout expires.
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(async () => {
            const res = await fetch(`/api/content/${content.id}`, { cache: "no-store" });
            const data = await res.json();
            if (String(data.checkedOutBy) !== String(user!.id)) {
                setExpired(true);
                setTimeout(() => onOpenChange(false), 2000);
            }
        }, 5 * 1000);
        return () => clearInterval(interval);
    }, [open, content.id, onOpenChange, user]);

    const handleApply = async () => {
        setSubmitted(true);
        if (Object.keys(getErrors(values)).length > 0) return;

        const formData = new FormData();
        formData.append("id", content.id.toString());
        formData.append("name", values.name);
        formData.append("linkURL", values.uploadMode === "url" ? values.linkUrl : "");
        formData.append("ownerID", values.ownerID.toString());
        formData.append("contentType", values.contentType);
        formData.append("status", values.status ?? "");
        formData.append("expiration", values.dateExpiration ? new Date(values.dateExpiration).toISOString() : "");
        formData.append("targetPersona", values.jobPosition);
        formData.append("employeeID", String(user!.id));
        if (values.uploadMode === "file" && values.file) {
            formData.append("file", values.file);
        }

        const res = await fetch("/api/content", { method: "PUT", body: formData });
        if (res.ok) {
            const updated = await res.json();
            onSave(updated);
            onOpenChange(false);
            toast.success("Content updated successfully!");
        } else {
            toast.error("Error updating content.");
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={async (nextOpen) => {
                if (!nextOpen && user && !expired) {
                    await fetch("/api/content/checkin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: content.id, employeeID: user.id }),
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
                    {/* Content ID — read-only, edit-only field */}
                    <div>
                        <Label className="my-2">Content ID</Label>
                        <Input value={content.id} className="bg-secondary" disabled />
                    </div>

                    <Separator />

                    <ContentFormFields
                        values={values}
                        patch={patch}
                        errors={errors}
                    />

                    {expired && (
                        <div className="rounded-md bg-destructive text-background px-2 py-1 text-sm text-center">
                            Your editing time has expired, please try again.
                        </div>
                    )}

                    <Button
                        className="mt-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-20 mx-auto rounded-lg px-2 py-1"
                        onClick={handleApply}
                        disabled={submitted && Object.keys(getErrors(values)).length > 0}
                    >
                        Apply
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
