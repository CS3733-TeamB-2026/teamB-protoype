import { Parser } from "node-sql-parser";

const parser = new Parser();

/**
 * Tables the LLM is allowed to query. Must match Prisma schema model names exactly.
 * Anything not on this list will be rejected by the validator before execution.
 *
 * If you add a new Prisma model that should be queryable, add it here.
 */
const ALLOWED_TABLES = new Set<string>([
    "Employee",
    "Content",
    "ServiceRequest",
    "Collection",
    "CollectionItem",
    "CollectionFavorite",
    "Bookmark",
    "Preview",
    "Notification",
    "NotificationDismissal",
    "ExpirationDismissal",
]);

/**
 * Postgres functions that could read files, exfiltrate data, or interact with
 * the OS. These should never appear in a generated query, even read-only.
 *
 * Lowercase comparison.
 */
const FORBIDDEN_FUNCTIONS = new Set<string>([
    "pg_read_file",
    "pg_read_binary_file",
    "pg_ls_dir",
    "pg_stat_file",
    "lo_import",
    "lo_export",
    "dblink",
    "dblink_exec",
    "copy", // COPY can read/write files when run as a statement
]);

export type ValidationResult =
    | { ok: true; sql: string }
    | { ok: false; reason: string };

/**
 * Validates a SQL string against multiple safety rules.
 *
 * Returns { ok: true } if the SQL is safe to execute, or { ok: false, reason }
 * with a human-readable explanation if it's not.
 *
 * NOTE: This is defense-in-depth on top of the read-only Postgres user.
 * The DB user blocks anything mutating at the database level. This validator
 * provides fast, friendly rejection with clear error messages BEFORE we round-trip
 * to Postgres.
 */

export function validateSQL(sql: string): ValidationResult {
    if (!sql || typeof sql !== "string") {
        return { ok: false, reason: "Empty or non-string SQL." }
    }

    //Length check
    if (sql.length > 10_000) {
        return { ok: false, reason: "SQL exceeds maximum length." }
    }

    //Parse SQL into an Abstract Syntax Tree (AST). This rejects unseparatable garbage
    let ast;
    try {
        ast = parser.astify(sql, { database: "postgresql" });
    } catch (err) {
        return {
            ok: false,
            reason: `Could not parse SQL: ${err instanceof Error ? err.message : String(err)}`,
        }
    }

    //Reject multiple SQL statements
    if (Array.isArray(ast) && ast.length > 1) {
        return { ok: false, reason: "Multiple SQL statements are not allowed." }
    }
    const statement = Array.isArray(ast) ? ast[0] : ast;
    if (!statement) {
        return { ok: false, reason: "Empty parse result." }
    }

    //Top level statement must be SELECT
    if (statement.type !== "select") {
        return { ok: false, reason: `Only SELECT statements are allowed, got: ${statement.type}.` }
    }

    const referencedTables: string[] = [];
    const calledFunctions: string[] = [];
    collectReferences(statement, referencedTables, calledFunctions);

    //Check table allowlist
    for (const table of referencedTables) {
        if (!ALLOWED_TABLES.has(table)) {
            return { ok: false, reason: `Query references disallowed table: ${table}. Allowed tables: ${[...ALLOWED_TABLES].join(",")}` };
        }
    }

    //Check forbidden functions
    for (const fn of calledFunctions) {
        if (FORBIDDEN_FUNCTIONS.has(fn.toLowerCase())) {
            return { ok: false, reason: `Query calls forbidden function: ${fn.toLowerCase()}` };
        }
    }

    return { ok: true, sql };
}

/**
 * Recursively walks a parsed SQL AST and collects table references and function calls.
 *
 * The AST shape varies by node type. We handle the common cases (FROM clauses,
 * JOINs, subqueries, function call expressions) and recurse into anything that
 * looks structural.
 */
function collectReferences(node: unknown, tables: string[], functions: string[]): void {
    if (node === null || node === undefined) return;
    if (typeof node !== "object") return;

    if (Array.isArray(node)) {
        for (const item of node) collectReferences(item, tables, functions);
        return;
    }

    const obj = node as Record<string, unknown>;

    // Table references appear as { table: "Employee", as: ..., db: ..., ... }
    // in FROM clauses, JOINs, etc.
    if (typeof obj.table === "string" && obj.table.length > 0) {
        tables.push(obj.table);
    }

    // Function call expressions look like:
    //   { type: "function", name: { name: [{ value: "count" }] }, args: ... }
    // or sometimes { type: "function", name: "now", ... }
    if (obj.type === "function" || obj.type === "aggr_func") {
        const name = extractFunctionName(obj.name);
        if (name) functions.push(name);
    }

    // Recurse into child fields
    for (const value of Object.values(obj)) {
        collectReferences(value, tables, functions);
    }

}

/**
 * Function names appear in different shapes depending on parser version.
 * Normalizes to a plain lowercase string when possible.
 */
function extractFunctionName(name: unknown): string | null {
    if (typeof name === "string") return name.toLowerCase();
    if (name && typeof name === "object") {
        const n = name as Record<string, unknown>;
        if (Array.isArray(n.name) && n.name.length > 0) {
            const first = n.name[0] as Record<string, unknown>;
            if (typeof first.value === "string") return first.value.toLowerCase();
        }
        if (typeof n.value === "string") return n.value.toLowerCase();
    }
    return null;
}

/**
 * Detects whether a SQL query is a "no data available" response — i.e., a
 * SELECT of constant string(s) without a FROM clause.
 *
 * When detected, callers can skip database execution and return the constant
 * directly to the user as an inline message.
 */
export function isNoDataResponse(sql: string): { isNoData: boolean; message?: string } {
    let ast;
    try {
        ast = parser.astify(sql, { database: "postgresql" });
    } catch (err) {
        return { isNoData: false };
    }

    const statement = Array.isArray(ast) ? ast[0] : ast;
    if (!statement || statement.type !== "select") return { isNoData: false };

    const stmt = statement as unknown as Record<string, unknown>

    //No FROM clause = constant SELECT
    const from = stmt.from;
    if (from !== null && from !== undefined && Array.isArray(from) && from.length > 0) {
        return { isNoData: false };
    }

    //Look for the string literal to return
    const columns = stmt.columns;
    if (!Array.isArray(columns) || columns.length === 0) return { isNoData: false };

    const firstCol = columns[0] as Record<string, unknown>;
    const expr = firstCol.expr as Record<string, unknown> | undefined;
    if (!expr) return { isNoData: false };

    if (
        (expr.type === "single_quote_string" || expr.type === "string") &&
        typeof expr.value === "string"
    ) {
        return { isNoData: true, message: expr.value };
    }

    return { isNoData: false };
}