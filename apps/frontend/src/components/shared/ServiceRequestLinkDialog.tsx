import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServiceRequestCard } from "@/components/shared/ServiceRequestCard";
import { ServiceRequestPicker } from "@/components/shared/ServiceRequestPicker";
import { AddServiceReqDialog } from "@/features/servicereqs/AddServiceReqDialog";
import type { ServiceReq } from "@/lib/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after a link is added so the parent can update its SR state. */
    onServiceReqsChange: (srs: ServiceReq[]) => void;
    /** Provide one of these to determine what gets linked. */
    contentId?: number;
    collectionId?: number;
}

/**
 * Dialog for viewing and managing service request links on a content item or collection.
 *
 * If the item is already linked to one or more SRs, shows them as expandable ServiceRequestCards.
 * If not linked to any SR, shows a ServiceRequestPicker to link an existing unlinked SR,
 * plus a "Create new" option that opens AddServiceReqDialog with the link pre-populated.
 *
 * Linking uses PATCH /api/servicereqs/:id/link (slim endpoint, no full SR payload needed).
 * Creating uses POST /api/servicereqs with the link pre-set via startingValues.
 */
export function ServiceRequestLinkDialog({ open, onOpenChange, onServiceReqsChange, contentId, collectionId }: Props) {
    const { getAccessTokenSilently } = useAuth0();
    const [linkedSRs, setLinkedSRs] = useState<ServiceReq[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [linking, setLinking] = useState(false);
    const [pickerRefreshKey, setPickerRefreshKey] = useState(0); // bumped to force ServiceRequestPicker to re-fetch unlinked SRs after a link/create
    const [createOpen, setCreateOpen] = useState(false);

    const endpoint = contentId != null
        ? `/api/content/${contentId}/service-requests`
        : `/api/collections/${collectionId}/service-requests`;

    const fetchLinkedSRs = async () => {
        setLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const data: ServiceReq[] = await res.json();
            setLinkedSRs(data);
            onServiceReqsChange(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) void fetchLinkedSRs();
    }, [open]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelectedId(null);
            setPickerRefreshKey(0);
        }
        onOpenChange(next);
    };

    const handleLink = async () => {
        if (selectedId == null) return;
        setLinking(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/servicereqs/${selectedId}/link`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    linkedContentId: contentId ?? null,
                    linkedCollectionId: collectionId ?? null,
                }),
            });
            if (!res.ok) { toast.error("Failed to link service request."); return; }
            toast.success("Service request linked.");
            setSelectedId(null);
            setPickerRefreshKey((k) => k + 1);
            await fetchLinkedSRs();
        } catch {
            toast.error("Failed to link service request.");
        } finally {
            setLinking(false);
        }
    };

    // startingValues pre-sets the link fields in AddServiceReqDialog so the SR is
    // created already linked — no second PATCH needed.
    const startingValues = contentId != null
        ? { linkMode: "content" as const, linkedContentId: contentId }
        : { linkMode: "collection" as const, linkedCollectionId: collectionId };

    const showPicker = linkedSRs.length === 0;

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md flex flex-col max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary text-center">Service Requests</DialogTitle>
                        <Separator />
                    </DialogHeader>

                    <div className="flex flex-col gap-4 overflow-hidden">
                        {/* Linked SRs list */}
                        <div className="overflow-y-auto overscroll-contain flex flex-col gap-2 min-h-0 max-h-72">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            ) : linkedSRs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    Not linked to any service requests.
                                </p>
                            ) : (
                                linkedSRs.map((sr) => <ServiceRequestCard key={sr.id} servicereq={sr} />)
                            )}
                        </div>

                        {/* Picker — only shown when not yet linked to any SR */}
                        {showPicker && !loading && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium">Link to a service request</p>
                                    <ServiceRequestPicker
                                        selectedId={selectedId}
                                        onSelect={(id) => setSelectedId(id)}
                                        refreshKey={pickerRefreshKey}
                                        inline
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                            onClick={() => setCreateOpen(true)}
                                        >
                                            + Create new service request
                                        </button>
                                        <Button
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            disabled={selectedId == null || linking}
                                            onClick={() => void handleLink()}
                                        >
                                            {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddServiceReqDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                startingValues={startingValues}
                onSave={async () => {
                    // SR is already linked via startingValues — just refresh the list.
                    setPickerRefreshKey((k) => k + 1);
                    await fetchLinkedSRs();
                }}
            />
        </>
    );
}
