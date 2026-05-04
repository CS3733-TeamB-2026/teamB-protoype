import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatInsightValue, formatInsightLabel } from "@/features/insights/formatInsightValue.ts";

type Props = {
    type: "bar" | "line" | "pie";
    rows: Record<string, unknown>[];
    columns: string[];
};

const MAX_BAR_CATEGORIES = 20;
const MAX_PIE_SLICES = 8;

//TODO: define better chart colors in index.css, I generated these ones temp for high contrast
const PALETTE = [
    "#1B3A5C", "#3B6FA0", "#5C9CD4", "#84BFEA", "#A6D2EE",
    "#C9E4F4", "#E8C547", "#D4881B", "#A03B3B", "#5E2C80",
];

function ResultChart({ type, rows, columns }: Props) {
    if (rows.length === 0 || columns.length === 0) return null;

    const numericColumns: string[] = [];
    const labelColumns: string[] = [];

    for (const col of columns) {
        if (isNumericColumn(rows, col)) {
            if (isLikelyIdColumn(col)) {
                labelColumns.push(col);
            } else {
                numericColumns.push(col);
            }
        } else {
            labelColumns.push(col);
        }
    }

    const labelKey = pickLabelColumn(labelColumns) ?? columns[0];
    const valueKeys = numericColumns.length > 0 ? numericColumns : [columns[columns.length - 1]];

    const data = rows.map((row) => {
        const out: Record<string, unknown> = { [labelKey]: formatLabel(row[labelKey]) };
        for ( const key of valueKeys ) {
            out[key] = makeNumber(row[key]);
        }
        return out;
    });

    const truncatedData =
        type === "pie"
            ? truncateAndRollupOthers(data, valueKeys[0], labelKey, MAX_PIE_SLICES)
            : type === "bar" && data.length > MAX_BAR_CATEGORIES
                ? data.slice(0, MAX_BAR_CATEGORIES)
                : data;

    const wasTruncated = truncatedData.length < data.length;

    const showLegend = valueKeys.length > 1;

    if (type === "bar") {
        return (
            <div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={truncatedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={labelKey} tickFormatter={formatInsightValue} />
                        <YAxis tickFormatter={formatInsightValue} />
                        <Tooltip
                            labelFormatter={formatInsightValue}
                            formatter={(value, name) => [formatInsightValue(value), formatInsightLabel(String(name))]}
                        />
                        {showLegend && <Legend formatter={formatInsightLabel} />}
                        {valueKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={PALETTE[i % PALETTE.length]} name={formatInsightLabel(key)} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
                {wasTruncated && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Showing top {truncatedData.length} of {data.length} results
                    </p>
                )}
            </div>
        );
    }

    if (type === "line") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={labelKey} tickFormatter={formatInsightValue} />
                    <YAxis />
                    <Tooltip
                        labelFormatter={formatInsightValue}
                        formatter={(value) => formatInsightValue(value)}
                    />
                    {showLegend && <Legend />}
                    {valueKeys.map((key, i) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={PALETTE[i % PALETTE.length]}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    if (type === "pie") {
        const valueKey = valueKeys[0];
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={truncatedData}
                        dataKey={valueKey}
                        nameKey={labelKey}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${formatInsightValue(name)}: ${formatInsightValue(value)}`}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>
                        ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [formatInsightValue(value), formatInsightValue(name)]}/>
                    <Legend formatter={formatInsightValue} />
                </PieChart>
            </ResponsiveContainer>
        );
    }
}

function isNumericColumn(
    rows: Record<string, unknown>[],
    col: string,
): boolean {
    for (const row of rows.slice(0,10)) {
        const val = row[col];
        if (val === null || val === undefined) continue;
        if (typeof val === "number") return true;
        if (typeof val === "string" && val !== "" && !isNaN(Number(val))) return true;
        return false;
    }
    return false;
}

function pickLabelColumn(labelColumns: string[]): string | null {
    if (labelColumns.length === 0) return null;
    const namePreferred = labelColumns.find((c) =>
        /name|title|label|displayname/i.test(c),
    );
    if (namePreferred) return namePreferred;
    return labelColumns[labelColumns.length - 1];
}

function makeNumber(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value !== "" && !isNaN(Number(value))) {
        return Number(value);
    }
    return null;
}

function formatLabel(value:unknown): string {
    if (value === null || value === undefined) return "-";
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
}

function truncateAndRollupOthers(
    data: Record<string, unknown>[],
    valueKey: string,
    labelKey: string,
    maxSlices: number,
): Record<string, unknown>[] {
    if (data.length <= maxSlices) return data;
    const sorted = [...data].sort(
        (a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0),
    );
    const top = sorted.slice(0, maxSlices - 1);
    const rest = sorted.slice(maxSlices - 1);
    const otherTotal = rest.reduce((sum, row) => sum + (Number(row[valueKey]) || 0), 0);
    return [
        ...top,
        { [labelKey]: "Other", [valueKey]: otherTotal },
    ];
}

function isLikelyIdColumn(col: string): boolean {
    const lower = col.toLowerCase();
    return (
        lower === "id" ||
        lower.endsWith("_id") ||
        lower.endsWith("id") && lower.length <= 6 // catches things like "userid", "rowid"
    );
}

export default ResultChart;