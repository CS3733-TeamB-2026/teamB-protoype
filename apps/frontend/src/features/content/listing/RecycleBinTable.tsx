import { useState } from "react";
import { Recycle, RotateCcw, Trash2 } from "lucide-react";
import { ConfirmRestoreDialog } from "@/features/content/forms/ConfirmRestoreDialog.tsx";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table.tsx";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { ContentStatusBadge } from "@/features/content/components/ContentStatusBadge.tsx";
import { ExpirationBadge } from "@/features/content/components/ExpirationBadge.tsx";
import { ContentTypeBadge } from "@/features/content/components/ContentTypeBadge.tsx";
import { ContentExtBadge } from "@/features/content/components/ContentExtBadge.tsx";
import { PersonaBadge } from "@/components/shared/PersonaBadge.tsx";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar.tsx";
import { getCategory, getExtension, getOriginalFilename } from "@/lib/mime.ts";
import { ContentTableHeader } from "@/features/content/listing/ContentTableHeader.tsx";
import type { SortState } from "@/hooks/use-sort-state.ts";
import type { ContentSortCol } from "@/features/content/listing/ContentTableHeader.tsx";
import type { ContentItem } from "@/lib/types.ts";

interface Props {
    deletedContent: ContentItem[];
    selectedIds: Set<number>;
    onToggleId: (id: number) => void;
    onSelectIds: (ids: number[]) => void;
    onDeselectIds: (ids: number[]) => void;
    sort: SortState<ContentSortCol>;
    onSort: (col: ContentSortCol) => void;
    onRestore: (item: ContentItem) => Promise<void>;
    onPermanentDelete: (id: number) => Promise<void>;
    onBulkRestore: (ids: number[]) => Promise<void>;
    onBulkPermanentDelete: (ids: number[]) => Promise<void>;
}

/**
 * Recycle bin table with bulk action bar.
 *
 * Derives its own selection state from `selectedIds` intersected with
 * `deletedContent` so it stays correct when items are removed externally.
 */
export function RecycleBinTable({
    deletedContent,
    selectedIds,
    onToggleId,
    onSelectIds,
    onDeselectIds,
    sort,
    onSort,
    onRestore,
    onPermanentDelete,
    onBulkRestore,
    onBulkPermanentDelete,
}: Props) {
    const [restoreTarget, setRestoreTarget] = useState<ContentItem | null>(null);
    const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<ContentItem | null>(null);
    const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const selectedHere = deletedContent.filter((i) => selectedIds.has(i.id));
    const allSelected = deletedContent.length > 0 && selectedHere.length === deletedContent.length;
    const someSelected = selectedHere.length > 0;

    if (deletedContent.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Recycle className="w-10 h-10" />
                <p className="text-sm">Recycle bin is empty.</p>
            </div>
        );
    }

    return (
        <>
            {someSelected && (
                <div className="flex items-center gap-2 my-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{selectedHere.length} selected</span>
                    <Button
                        variant="outline"
                        className="hover:bg-secondary hover:text-secondary-foreground h-10 text-base border-input rounded-md text-foreground"
                        onClick={() => setBulkRestoreOpen(true)}
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                    </Button>
                    <Button
                        variant="destructive"
                        className="h-10 text-base"
                        onClick={() => setBulkDeleteOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Permanently
                    </Button>
                </div>
            )}

            <Table className="text-left mt-2">
                <ContentTableHeader
                    sort={sort}
                    onSort={onSort}
                    allSelected={allSelected}
                    someSelected={someSelected}
                    onToggleAll={() => {
                        if (allSelected) {
                            onDeselectIds(deletedContent.map((i) => i.id));
                        } else {
                            onSelectIds(deletedContent.map((i) => i.id));
                        }
                    }}
                />
                <TableBody>
                    {deletedContent.map((item, index) => {
                        const isFile = !!item.fileURI;
                        const isLink = !!item.linkURL;
                        const originalFilename = isFile ? getOriginalFilename(item.fileURI!) : null;
                        const category = getCategory(null, originalFilename);
                        const ext = originalFilename ? getExtension(originalFilename) : null;

                        return (
                            <TableRow key={item.id} className={index % 2 === 0 ? "bg-muted/15" : ""}>
                                <TableCell className="w-8 pr-0" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 cursor-pointer accent-primary"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => onToggleId(item.id)}
                                    />
                                </TableCell>
                                <TableCell className="w-8 pr-0">
                                    <ContentIcon category={category} isLink={isLink} className="w-5 h-5" />
                                </TableCell>
                                <TableCell className="w-full max-w-0">
                                    <span className="truncate font-medium text-foreground">{item.displayName}</span>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    {item.owner
                                        ? <EmployeeAvatar employee={item.owner} size="sm" />
                                        : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    <ExpirationBadge expiration={item.expiration} />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    <ContentStatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    <ContentTypeBadge contentType={item.contentType} />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    <PersonaBadge persona={item.targetPersona} />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    <ContentExtBadge category={category} ext={ext} isLink={isLink} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-center gap-2">
                                        <Button variant="outline" size="sm" title="Restore" onClick={() => setRestoreTarget(item)}>
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                        <Button variant="destructive" size="sm" title="Delete permanently" onClick={() => setPermanentDeleteTarget(item)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <ConfirmRestoreDialog
                open={!!restoreTarget}
                onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}
                description={restoreTarget
                    ? <span>Restore <strong>"{restoreTarget.displayName}"</strong>? It will be moved back to your active content.</span>
                    : undefined}
                onConfirm={async () => {
                    if (restoreTarget) await onRestore(restoreTarget);
                    setRestoreTarget(null);
                }}
            />

            <ConfirmRestoreDialog
                open={bulkRestoreOpen}
                onOpenChange={(open) => { if (!open) setBulkRestoreOpen(false); }}
                description={<span>Restore <strong>{selectedHere.length} item{selectedHere.length !== 1 ? "s" : ""}</strong>? They will be moved back to your active content.</span>}
                onConfirm={async () => {
                    await onBulkRestore(selectedHere.map((i) => i.id));
                    setBulkRestoreOpen(false);
                }}
            />

            <ConfirmDeleteDialog
                open={!!permanentDeleteTarget}
                onOpenChange={(open) => { if (!open) setPermanentDeleteTarget(null); }}
                description={permanentDeleteTarget
                    ? <span>Permanently delete <strong>"{permanentDeleteTarget.displayName}"</strong>? This cannot be undone.</span>
                    : undefined}
                onConfirm={async () => {
                    if (permanentDeleteTarget) await onPermanentDelete(permanentDeleteTarget.id);
                    setPermanentDeleteTarget(null);
                }}
            />

            <ConfirmDeleteDialog
                open={bulkDeleteOpen}
                onOpenChange={(open) => { if (!open) setBulkDeleteOpen(false); }}
                description={<span>Permanently delete <strong>{selectedHere.length} item{selectedHere.length !== 1 ? "s" : ""}</strong>? This cannot be undone.</span>}
                onConfirm={async () => {
                    await onBulkPermanentDelete(selectedHere.map((i) => i.id));
                    setBulkDeleteOpen(false);
                }}
            />
        </>
    );
}
