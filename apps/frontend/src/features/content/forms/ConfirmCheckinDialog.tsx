import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

/**
 * Props for the ConfirmCheckoutDialog component.
 */
interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description?: React.ReactNode;
    onConfirm: () => Promise<void>;
}

/**
 * A confirmation dialog component for content checkout operations.
 * Displays a warning to the user about locking content and handles the async confirmation process
 * with a loading state.
 */
export function ConfirmCheckinDialog({ open, onOpenChange, description, onConfirm }: Props) {
    const [loading, setLoading] = useState(false);

    /**
     * Handles the confirm action, managing the loading state while the async operation completes.
     */
    async function handleConfirm(e: React.MouseEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    }


    return (
        <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Do you want to check in this content?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ?? "You will not be able to edit or delete this content unless you check it back out."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-accent! text-white! hover:bg-accent/90!"
                        disabled={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check in"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}