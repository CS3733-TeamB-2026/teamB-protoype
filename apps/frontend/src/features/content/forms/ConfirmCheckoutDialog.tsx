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
export function ConfirmCheckoutDialog({ open, onOpenChange, description, onConfirm }: Props) {
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
                    <AlertDialogTitle>Are you sure you want to checkout this content?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ?? "This will prevent other users from editing and deleting this content until you check it back in."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-accent! text-white! hover:bg-accent/90!"
                        disabled={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Checkout"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
