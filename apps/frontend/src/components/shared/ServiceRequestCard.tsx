import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { ServiceReqDetail } from "@/components/shared/ServiceReqDetail";
import { formatLabel } from "@/lib/utils";
import type { ServiceReq } from "@/lib/types";

interface Props {
    servicereq: ServiceReq;
    compact?: boolean;
    hideAssignee?: boolean;
}

/**
 * Standalone expandable card for a single service request.
 *
 * Click anywhere on the header row to toggle the detail panel (notes,
 * linked content, linked collection). Unlike the table-row version in
 * ViewServiceReqs, this renders as a Card so it works inside dialogs.
 *
 * Pass `compact` when embedding inside another Card (e.g. dashboard widgets)
 * to skip the outer Card wrapper and avoid card-in-card nesting.
 */
export function ServiceRequestCard({ servicereq, compact = false, hideAssignee = false }: Props) {
    const [expanded, setExpanded] = useState(false);

    const headerButton = (
        <button
            type="button"
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            onClick={() => setExpanded((v) => !v)}
        >
            {/* Name + type */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{servicereq.name}</p>
                <p className="text-xs text-muted-foreground">{formatLabel(servicereq.type)}</p>
            </div>

            {/* Dates */}
            <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                <span>Created {new Date(servicereq.created).toLocaleDateString()}</span>
                <span>Due {new Date(servicereq.deadline).toLocaleDateString()}</span>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-1 shrink-0">
                {!hideAssignee && (
                    servicereq.assignee ? (
                        <EmployeeAvatar employee={servicereq.assignee} size="sm" />
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )
                )}
                <EmployeeAvatar employee={servicereq.owner} size="sm" />
            </div>

            {/* stopPropagation prevents the Link click from also toggling expand */}
            <Link
                to="/servicereqs"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="View in service requests table"
            >
                <ExternalLink className="w-4 h-4" />
            </Link>

            {expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
        </button>
    );

    if (compact) {
        return (
            <div className="overflow-hidden rounded-md border">
                {headerButton}
                {expanded && (
                    <div className="border-t px-4 py-3">
                        <ServiceReqDetail servicereq={servicereq} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className="overflow-hidden">
            {headerButton}
            {expanded && (
                <CardContent className="border-t px-4 py-3">
                    <ServiceReqDetail servicereq={servicereq} />
                </CardContent>
            )}
        </Card>
    );
}