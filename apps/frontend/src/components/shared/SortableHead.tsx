import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import type { SortState } from "@/helpers/useSortState.ts";

interface Props<T extends string> {
    column: T;
    label: string;
    sort: SortState<T>;
    onSort: (column: T) => void;
    className?: string;
}

export function SortableHead<T extends string>({ column, label, sort, onSort, className }: Props<T>) {
    const active = sort.column === column;
    return (
        <TableHead className={className}>
            <button
                className="flex items-center gap-1 uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none"
                onClick={() => onSort(column)}
            >
                {label}
                {active ? (
                    sort.direction === "asc" ? (
                        <ArrowUp className="w-3 h-3" />
                    ) : (
                        <ArrowDown className="w-3 h-3" />
                    )
                ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                )}
            </button>
        </TableHead>
    );
}
