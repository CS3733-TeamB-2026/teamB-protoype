import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatInsightValue } from "@/features/insights/formatInsightValue.ts";

type Props = {
    rows: Record<string, unknown>[];
    columns: string[];
};

function ResultTable({ rows, columns }: Props) {
    return (
        <div className="overflow-x-auto rounded border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.slice(0, 100).map((row, i) => (
                        <TableRow key={i}>
                            {columns.map((col) => (
                                <TableCell key={col}>{formatCell(formatInsightValue(row[col]))}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {rows.length > 100 && (
                <p className="border-t p-2 text-center text-xs text-muted-foreground">
                    Showing first 100 of {rows.length} rows
                </p>
            )}
        </div>
    );
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default ResultTable;