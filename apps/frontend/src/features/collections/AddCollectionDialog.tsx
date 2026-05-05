import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Lock, LockOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import type { Collection } from "@/lib/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When provided, called with the new collection instead of navigating to its detail page. */
    onCreated?: (collection: Collection) => void;
}

/**
 * Dialog for creating a new collection with a name and visibility setting.
 *
 * `submitted` is set on the first submit attempt and gates validation display so
 * errors don't appear before the user has interacted with the form. State is reset
 * both on explicit Reset and whenever the dialog closes, so reopening it is always fresh.
 *
 * On success: calls `onCreated` with the new collection if provided (e.g. to
 * auto-select it in a picker), otherwise navigates to the collection's detail page.
 */
export function AddCollectionDialog({ open, onOpenChange, onCreated }: Props) {
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const nameError = submitted && !displayName.trim() ? "Name is required." : null;

    const handleReset = () => {
        setDisplayName("");
        setIsPublic(false);
        setSubmitted(false);
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        if (!displayName.trim()) return;

        setSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ displayName: displayName.trim(), isPublic }),
            });
            if (!res.ok) { toast.error("Failed to create collection."); return; }
            const created: Collection = await res.json();
            toast.success("Collection created successfully!");
            onOpenChange(false);
            handleReset();
            if (onCreated) {
                onCreated(created);
            } else {
                navigate(`/collections/${created.id}`);
            }
        } catch {
            toast.error("Failed to create collection.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) handleReset();
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary text-center">New Collection</DialogTitle>
                    <DialogDescription className="text-muted-foreground mb-2 text-center">
                        Give your collection a name. You can add content after it's created.
                    </DialogDescription>
                    <Separator />
                </DialogHeader>

                <div className="overflow-y-auto flex-1 flex flex-col min-w-0 pr-2 mx-4">
                    <Field className="bg-background">
                        <FieldLabel className="text-primary text-lg" htmlFor="collection-name">
                            Name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            id="collection-name"
                            className="h-8 md:text-sm"
                            placeholder="e.g. Underwriter Onboarding"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                            disabled={submitting}
                            autoFocus
                        />
                        {nameError && <FieldDescription className="text-destructive">{nameError}</FieldDescription>}
                    </Field>

                    <div className="py-6"><Separator className="bg-primary" /></div>

                    <Field className="bg-background">
                        <FieldLabel className="text-primary text-lg">
                            Visibility
                        </FieldLabel>
                        <div>
                        <ToggleGroup
                            type="single"
                            value={isPublic ? "public" : "private"}
                            onValueChange={(v) => { if (v) setIsPublic(v === "public"); }}
                            disabled={submitting}
                            className="rounded-full border border-input bg-muted/20 p-0.5 gap-0.5 w-fit"
                        >
                            <ToggleGroupItem value="private" aria-label="Private" className="rounded-full! px-4 gap-1.5">
                                <Lock className="w-4 h-4" /> Private
                            </ToggleGroupItem>
                            <ToggleGroupItem value="public" aria-label="Public" className="rounded-full! px-4 gap-1.5">
                                <LockOpen className="w-4 h-4" /> Public
                            </ToggleGroupItem>
                        </ToggleGroup>
                        </div>
                        <FieldDescription>
                            {isPublic ? "Visible to all employees." : "Only visible to you and admins."}
                        </FieldDescription>
                    </Field>
                </div>

                <DialogFooter>
                    <div className="flex flex-col justify-center! items-center gap-4 mt-0 w-full">
                        <Separator />
                        <div className="flex flex-row gap-2">
                            <Button variant="outline" onClick={handleReset} disabled={submitting}>
                                Reset
                            </Button>
                            <Button
                                className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                onClick={() => void handleSubmit()}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}