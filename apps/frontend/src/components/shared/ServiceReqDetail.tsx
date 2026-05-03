import type { ServiceReq } from "@/lib/types";
import { ContentItemCard } from "@/components/shared/ContentItemCard";
import { CollectionCard } from "@/components/shared/CollectionCard";

interface Props {
    servicereq: ServiceReq;
}

/** Expanded detail panel for a service request: notes, linked content, and linked collection. */
export function ServiceReqDetail({ servicereq }: Props) {
    const hasNotes = !!servicereq.notes?.trim();
    const hasLinked = !!(servicereq.linkedContent || servicereq.linkedCollection);

    if (!hasNotes && !hasLinked) {
        return <p className="text-sm text-muted-foreground italic">No additional details.</p>;
    }

    return (
        <div className="flex flex-col gap-3">
            {hasNotes && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{servicereq.notes}</p>
                </div>
            )}
            {servicereq.linkedContent && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Linked Content</p>
                    <ContentItemCard item={servicereq.linkedContent} />
                </div>
            )}
            {servicereq.linkedCollection && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Linked Collection</p>
                    <CollectionCard collection={servicereq.linkedCollection} />
                </div>
            )}
        </div>
    );
}
