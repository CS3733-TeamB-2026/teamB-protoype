import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLocale } from "@/languageSupport/localeContext.tsx";
import { useTranslation } from "@/languageSupport/useTranslation.ts";

interface Props {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Rows-per-page selector and first/prev/next/last navigation bar for paginated tables.
 *
 * Changing the page size calls both `onPageSizeChange` and `onPageChange(1)` so the
 * parent doesn't need to reset the page itself inside `onPageSizeChange`.
 */
export function TablePagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: Props) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between mt-4 px-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <span>{ts('pages.rowsPerPage')}</span>
                <select
                    value={pageSize}
                    onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
                    className="border border-border rounded px-2 py-1 bg-background text-foreground text-sm"
                >
                    {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-3">
                <span>{start}–{end} {ts('of')} {totalItems}</span>
                <div className="flex items-center gap-1">
                    <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="First page">
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="Previous page">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2">{ts('page')} {currentPage} {ts('of')} {totalPages}</span>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="Next page">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="Last page">
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
