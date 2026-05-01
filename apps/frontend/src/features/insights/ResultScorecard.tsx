type Props = {
    rows: Record<string, unknown>[];
    columns: string[];
}

function ResultScorecard( {rows, columns}: Props) {
    const row = rows[0];
    const valueColumn = columns[columns.length - 1];
    const value = row[valueColumn];

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="text-5xl font-bold tabular-nums text-[#1B3A5C]">
                {formatValue(value)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{valueColumn}</div>
        </div>
    )
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
}

export default ResultScorecard;