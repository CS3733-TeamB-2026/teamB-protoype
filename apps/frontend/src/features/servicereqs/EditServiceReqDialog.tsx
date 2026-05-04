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
import { ServiceReqFormFields } from "@/features/servicereqs/ServiceReqFormFields.tsx";
import { fromServiceReqItem, buildServiceReqJSON } from "@/features/servicereqs/servicereq-form.ts";
import type { ServiceReq } from "@/lib/types.ts";
import { useAuth0 } from "@auth0/auth0-react";
import { useServiceReqForm } from "@/features/servicereqs/use-servicereq-form.tsx";

interface Props {
    content: ServiceReq;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (updated: ServiceReq) => void;
}

/**
 * Dialog for editing an existing service req item via `PUT /api/servicereq`.
 */
export function EditServiceReqDialog({ content, open, onOpenChange, onSave }: Props) {
    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useServiceReqForm(fromServiceReqItem(content));

    const handleReset = () => reset(fromServiceReqItem(content));

    const user = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const handleApply = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        try {
            const json = buildServiceReqJSON(values);
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/servicereqs", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: json,
            });
            if (!res.ok) { toast.error("Error updating service request."); return; }
            const updated = await res.json();
            onSave(updated);
            onOpenChange(false);
            toast.success("Service Request updated successfully!");
        } catch {
            toast.error("Error updating service request.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Modify Service Request</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modify a work service request.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="overflow-y-auto flex-1 flex flex-col gap-2 min-w-0 pr-2">
                    {/* Service Request ID — read-only, edit-only field */}
                    <div>
                        <Label className="my-2">Service Request ID</Label>
                        <Input value={content.id} className="bg-secondary" disabled />
                    </div>

                    <Separator />

                    <ServiceReqFormFields
                        key={formKey}
                        values={values}
                        patch={patch}
                        errors={errors}
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
