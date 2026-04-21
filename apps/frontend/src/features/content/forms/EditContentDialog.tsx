import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { toast } from "sonner";
import { ContentFormFields } from "@/features/content/forms/ContentFormFields.tsx";
import { fromContentItem, buildContentFormData, xhrFetch } from "@/features/content/forms/content-form.ts";
import type { ContentItem } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { useContentForm } from "@/features/content/forms/use-content-form.ts";

interface Props {
    content: ContentItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ContentItem) => void;
}

/**
 * Dialog for editing an existing content item via `PUT /api/content`.
 *
 * This dialog should only be opened after a successful checkout (`POST
 * /api/content/checkout`), which acquires a pessimistic lock. Two mechanisms
 * handle lock expiry (the backend clears locks after 2 minutes):
 *
 * 1. A 5-second polling interval re-fetches the item and closes the dialog if
 *    `checkedOutById` no longer matches the current user — meaning the lock
 *    expired and was cleared by the server's cleanup job.
 * 2. When the dialog closes normally (user cancels or saves), `onOpenChange`
 *    fires a `POST /api/content/checkin` to explicitly release the lock. The
 *    checkin is skipped when `expired` is true to avoid a redundant call after
 *    the server already cleared the lock.
 *
 * When a file is attached, the submit uses XHR instead of fetch so upload
 * progress can be tracked and the request can be cancelled mid-flight.
 */
export function EditContentDialog({ content, open, onOpenChange, onSave }: Props) {
    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useContentForm(fromContentItem(content), true);

    const handleReset = () => reset(fromContentItem(content));

    const {user} = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleCancel = () => abortRef.current?.abort();

    const handleApply = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        const formData = buildContentFormData(values);
        formData.append("id", content.id.toString());
        formData.append("employeeID", String(user.id));

        const token = await getAccessTokenSilently();
        const hasFile = values.uploadMode === "file" && values.file !== null;

        let res: { ok: boolean; json: () => Promise<unknown> };
        try {
            if (hasFile) {
                const controller = new AbortController();
                abortRef.current = controller;
                setUploadProgress(0);
                res = await xhrFetch(
                    "/api/content",
                    "PUT",
                    { Authorization: `Bearer ${token}` },
                    formData,
                    setUploadProgress,
                    controller.signal,
                );
            } else {
                setSubmitting(true);
                const r = await fetch("/api/content", {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                res = { ok: r.ok, json: () => r.json() };
            }
            if (!res.ok) { toast.error("Error updating content."); return; }
            const updated = await res.json() as ContentItem;
            onSave(updated);
            onOpenChange(false);
            toast.success("Content updated successfully!");
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                toast.info("Upload cancelled.");
            } else {
                toast.error("Error updating content.");
            }
        } finally {
            setSubmitting(false);
            setUploadProgress(null);
            abortRef.current = null;
        }
    };

    const uploading = uploadProgress !== null;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!uploading && !submitting) onOpenChange(o); }}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Modify Content</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify a piece of content.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="overflow-y-auto flex-1 flex flex-col gap-2 min-w-0 pr-2">
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
                        mode="edit"
                        disabled={uploading || submitting}
                    />
                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-5 w-full">
                        <Separator />
                        {uploading ? (
                            <div className="flex flex-col gap-2 w-full items-center">
                                <div className="flex items-center justify-between w-full text-sm text-muted-foreground px-1">
                                    <span>Uploading…</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="w-full" />
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex flex-row gap-2">
                                <Button variant="outline" onClick={handleReset} disabled={submitting}>Reset</Button>
                                <Button
                                    className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                    onClick={handleApply}
                                    disabled={hasErrors || submitting}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
