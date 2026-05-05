import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatInsightValue, formatInsightLabel } from "@/features/insights/formatInsightValue.ts";

type Props = {
    rows: Record<string, unknown>[];
    columns: string[];
};

/**
 * Renders SQL result rows as a scrollable shadcn/ui Table.
 * Capped at `MAX_TABLE_ROWS` rows; shows a count notice when truncated.
 * Column headers are humanized via `formatInsightLabel`; cell values via `formatInsightValue`.
 */
function ResultTable({ rows, columns }: Props) {

    const MAX_TABLE_ROWS = 20;

    return (
        <div className="overflow-x-auto rounded border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col}>{formatInsightLabel(col)}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.slice(0, MAX_TABLE_ROWS).map((row, i) => (
                        <TableRow key={i}>
                            {columns.map((col) => (
                                <TableCell key={col}>{formatCell(formatInsightValue(row[col]))}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {rows.length > MAX_TABLE_ROWS && (
                <p className="border-t p-2 text-center text-xs text-muted-foreground">
                    Showing first {MAX_TABLE_ROWS} of {rows.length} rows
                </p>
            )}
        </div>
    );
}

/** Converts a raw cell value to a display string; serializes objects as JSON. */
function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default ResultTable;