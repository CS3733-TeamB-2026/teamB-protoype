import { formatInsightValue } from "@/features/insights/formatInsightValue.ts";

type Props = {
    rows: Record<string, unknown>[];
    columns: string[];
}

function ResultScorecard( {rows, columns}: Props) {
    if (rows.length === 0) return null;
    const row = rows[0];

    let valueColumn: string | undefined;
    let labelColumns: string[] = [];

    for (const col of columns) {
        const val = row[col];
        if (typeof val === "number" || (typeof val === "string" && !isNaN(Number(val))) ) {
            if (!valueColumn) {
                valueColumn = col;
            } else {
                labelColumns.push(col);
            }
        } else {
            labelColumns.push(col);
        }
    }

    if (!valueColumn) {
        valueColumn = columns[columns.length - 1];
        labelColumns = columns.slice(0, -1);
    }

    const value = row[valueColumn];
    const labelParts = labelColumns
        .map((col) => formatInsightValue(row[col]))
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map((v) => String(v));

    return (
        <div className="flex flex-col items-center justify-center py-8">
            {labelParts.length > 0 && (
                <div className="mb-2 text-sm text-muted-foreground">
                    {labelParts.join(" · ")}
                </div>
            )}
            <div className="text-5xl font-bold tabular-nums text-[oklch(0.343_0.07_252.435)]">
                {formatValue(formatInsightValue(value))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
                {prettifyColumnName(valueColumn)}
            </div>
        </div>
    )
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
}

function prettifyColumnName(col: string): string {
    return col
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default ResultScorecard;