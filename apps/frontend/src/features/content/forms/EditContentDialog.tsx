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
import { toast } from "sonner";
import { ContentFormFields } from "@/features/content/forms/ContentFormFields.tsx";
import { fromContentItem, buildContentFormData } from "@/features/content/forms/content-form.ts";
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
 */
export function EditContentDialog({ content, open, onOpenChange, onSave }: Props) {
    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useContentForm(fromContentItem(content), true);

    const handleReset = () => reset(fromContentItem(content));

    const {user} = useUser();
    const { getAccessTokenSilently } = useAuth0();

    // Kick the user out if the checkout expires.


    const handleApply = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        const formData = buildContentFormData(values);
        formData.append("id", content.id.toString());
        formData.append("employeeID", String(user.id));

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
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
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                        showLastModified
                    />

                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-5 w-full">
                        <Separator />
                        <div className="flex flex-row gap-2">
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button
                                className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                onClick={handleApply}
                                disabled={hasErrors}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
