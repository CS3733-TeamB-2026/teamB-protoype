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
import { toast } from "sonner";
import { ContentFormFields } from "@/features/content/forms/ContentFormFields.tsx";
import { initialValues, buildContentFormData } from "@/features/content/forms/content-form.ts";
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
 */
export function AddContentDialog({ open, onOpenChange, onSave }: Props) {
    const user = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useContentForm(initialValues(user?.id ?? 0));

    const handleReset = () => reset(initialValues(user!.id));

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        try {
            const formData = buildContentFormData(values);
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) { toast.error("Error creating content."); return; }
            const created: ContentItem = await res.json();
            onSave(created);
            onOpenChange(false);
            reset(initialValues(user.id));
            toast.success("Content created successfully!");
        } catch {
            toast.error("Error creating content.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                        showLastModified
                    />

                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-0 w-full">
                        <Separator />
                        <div className="flex flex-row gap-2">
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button
                                className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                onClick={handleSubmit}
                                disabled={hasErrors}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
