/**
 * Matches ISO 8601 timestamps as returned by Postgres/Prisma JSON serialization.
 * Examples: "2026-05-03T00:00:00.000Z", "2026-05-03T14:30:00Z"
 */
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * If the time portion of an ISO timestamp is exactly midnight UTC, treat it as
 * a date-only value. Postgres `date` columns and `timestamp` columns set to
 * day-boundaries both serialize this way, and date-only is the more common
 * intent in our analytics queries (DATE_TRUNC, GROUP BY date, etc.).
 */
function isDateOnly(iso: string): boolean {
    return iso.endsWith("T00:00:00.000Z") || iso.endsWith("T00:00:00Z");
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC", // render the same calendar day the DB returned, regardless of viewer TZ
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

/**
 * Format a value pulled from an insights query result for display in chart
 * labels, axis ticks, and table cells.
 *
 * - ISO timestamps at midnight UTC → "May 3, 2026"
 * - ISO timestamps with a time component → "May 3, 2026, 2:30 PM" (local TZ)
 * - null/undefined → "—"
 * - numbers → toLocaleString (adds thousands separators)
 * - everything else → String(value)
 */
export function formatInsightValue(value: unknown): string {
    if (value == null) return "—";

    if (typeof value === "string" && ISO_TIMESTAMP_RE.test(value)) {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value; // malformed — fall back to raw
        return isDateOnly(value)
            ? dateFormatter.format(d)
            : dateTimeFormatter.format(d);
    }

    if (typeof value === "number") return value.toLocaleString();

    return String(value);
}