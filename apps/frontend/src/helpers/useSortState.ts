import { useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<T extends string> {
    column: T | null;
    direction: SortDirection;
}

export function useSortState<T extends string>(initial?: SortState<T>) {
    const [sort, setSort] = useState<SortState<T>>(initial ?? { column: null, direction: "asc" });

    function toggle(column: T) {
        setSort((prev) =>
            prev.column === column
                ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { column, direction: "asc" },
        );
    }

    return [sort, toggle] as const;
}

export function applySortState<T, K extends string>(
    items: T[],
    sort: SortState<K>,
    getValue: (item: T, column: K) => string | number | null | undefined,
): T[] {
    if (!sort.column) return items;
    const col = sort.column;
    return [...items].sort((a, b) => {
        const av = getValue(a, col) ?? "";
        const bv = getValue(b, col) ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.direction === "asc" ? cmp : -cmp;
    });
}
