import {
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import { SortableHead } from "@/components/shared/SortableHead.tsx";
import type { SortState } from "@/hooks/use-sort-state.ts";
import { useLocale } from "@/languageSupport/localeContext.tsx";
import { useTranslation } from "@/languageSupport/useTranslation.ts";

export type ContentSortCol = "name" | "owner" | "expiration" | "status" | "contentType" | "persona" | "docType";

interface Props {
    sort: SortState<ContentSortCol>;
    onSort: (col: ContentSortCol) => void;
    allSelected: boolean;
    someSelected: boolean;
    onToggleAll: () => void;
}

/** Shared table header for the main content table and the recycle bin table. */
export function ContentTableHeader({ sort, onSort, allSelected, someSelected, onToggleAll }: Props) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent">
                <TableHead className="w-8 pr-0">
                    <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-primary"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={onToggleAll}
                    />
                </TableHead>
                <TableHead className="w-8" />
                <SortableHead column="name" label={ts('content.name')} sort={sort} onSort={onSort} />
                <SortableHead column="owner" label={ts('content.owner')} sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortableHead column="expiration" label="Expiration" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortableHead column="status" label={ts('status')} sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortableHead column="contentType" label={ts('kind')} sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortableHead column="persona" label={ts('persona')} sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <SortableHead column="docType" label={ts('file.type')} sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                <TableHead className="uppercase tracking-wider text-muted-foreground select-none text-center">
                    {ts('content.actions')}
                </TableHead>
            </TableRow>
        </TableHeader>
    );
}
