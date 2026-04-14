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
    const [formKey, setFormKey] = useState(0);
    const errors = submitted ? getErrors(values) : {};

    const handleReset = () => {
        setValues(fromContentItem(content));
        setSubmitted(false);
        setFormKey(k => k + 1);
    };

    const [expired, setExpired] = useState(false);
    const [user] = useUser();

    // Kick the user out if the checkout expires.
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(async () => {
            const res = await fetch(`/api/content/${content.id}`, { cache: "no-store" });
            const data = await res.json();
            if (String(data.checkedOutById) !== String(user!.id)) {
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

        const lastModifiedDate = values.dateModified ? new Date(values.dateModified) : new Date();
        const [lmh, lmm, lms] = values.lastModifiedTime.split(":").map(Number);
        lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
        formData.append("lastModified", lastModifiedDate.toISOString());

        if (values.dateExpiration) {
            const expDate = new Date(values.dateExpiration);
            expDate.setHours(0, 0, 0, 0);
            formData.append("expiration", expDate.toISOString());
        } else {
            formData.append("expiration", "");
        }
        formData.append("targetPersona", values.jobPosition);
        formData.append("employeeID", String(user!.id));
        if (values.uploadMode === "file" && values.file) {
            formData.append("file", values.file);
        }

        try {
            const res = await fetch("/api/content", { method: "PUT", body: formData });
            if (!res.ok) { toast.error("Error updating content."); return; }
            const updated = await res.json();
            onSave(updated);
            onOpenChange(false);
            toast.success("Content updated successfully!");
        } catch {
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
                        key={formKey}
                        values={values}
                        patch={patch}
                        errors={errors}
                        showLastModified
                    />

                    {expired && (
                        <div className="rounded-md bg-destructive text-background px-2 py-1 text-sm text-center">
                            Your editing time has expired, please try again.
                        </div>
                    )}

                    <div className="flex justify-center gap-4 mt-5">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                        <Button
                            className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                            onClick={handleApply}
                            disabled={Object.keys(getErrors(values)).length > 0}
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
