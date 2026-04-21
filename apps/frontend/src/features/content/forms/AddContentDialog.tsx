import { useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { toast } from "sonner";
import { ContentFormFields } from "@/features/content/forms/ContentFormFields.tsx";
import { initialValues, buildContentFormData, xhrFetch } from "@/features/content/forms/content-form.ts";
import type { ContentItem } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { useContentForm } from "@/features/content/forms/use-content-form.ts";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (created: ContentItem) => void;
}

/**
 * Dialog for creating a new content item via `POST /api/content`.
 *
 * After a successful save, calls `onSave` with the server-returned item so the
 * parent (`ViewContent`) can append it to the list and immediately fetch its
 * link preview without waiting for the next poll.
 *
 * The form is reset after each successful submission so the dialog is clean if
 * the user opens it again. `formKey` forces `ContentFormFields` to remount on
 * reset, clearing any local state inside that component (e.g., file picker errors).
 *
 * When a file is attached, the submit uses XHR instead of fetch so upload
 * progress can be tracked and the request can be cancelled mid-flight.
 */
export function AddContentDialog({ open, onOpenChange, onSave }: Props) {
    const user = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useContentForm(initialValues(user?.id ?? 0, user?.persona ?? ""));

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleReset = () => reset(initialValues(user!.id, user!.persona ?? ""));

    const handleCancel = () => abortRef.current?.abort();

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        const formData = buildContentFormData(values);
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
                    "POST",
                    { Authorization: `Bearer ${token}` },
                    formData,
                    setUploadProgress,
                    controller.signal,
                );
            } else {
                const r = await fetch("/api/content", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                res = { ok: r.ok, json: () => r.json() };
            }
            if (!res.ok) { toast.error("Error creating content."); return; }
            const created = await res.json() as ContentItem;
            onSave(created);
            onOpenChange(false);
            reset(initialValues(user.id, user.persona ?? ""));
            toast.success("Content created successfully!");
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                toast.info("Upload cancelled.");
            } else {
                toast.error("Error creating content.");
            }
        } finally {
            setUploadProgress(null);
            abortRef.current = null;
        }
    };

    const uploading = uploadProgress !== null;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!uploading) onOpenChange(o); }}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Add Content</DialogTitle>
                    <DialogDescription className="text-muted-foreground mb-2">
                        Add a new piece of content.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>

                <div className="overflow-y-auto flex-1 flex flex-col gap-2 min-w-0 pr-2">
                    <ContentFormFields
                        key={formKey}
                        values={values}
                        patch={patch}
                        errors={errors}
                        mode="add"
                    />
                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-0 w-full">
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
                                <Button variant="outline" onClick={handleReset}>Reset</Button>
                                <Button
                                    className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                    onClick={handleSubmit}
                                    disabled={hasErrors}
                                >
                                    Submit
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
