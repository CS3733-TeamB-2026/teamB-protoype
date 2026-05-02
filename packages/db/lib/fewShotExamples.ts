/**
 * Few-shot examples for the NL→SQL prompt.
 *
 * These teach the LLM:
 *  - Your table/column quoting style
 *  - How to JOIN across the schema's specific FK names
 *  - How to filter by enum values
 *  - How to handle date grouping with date_trunc
 *  - When to LIMIT, ORDER BY, etc.
 *  - The structured response shape (sql + explanation + chart + title)
 *
 * Order matters slightly — earlier examples are weighted more heavily by the model.
 * Lead with simple/canonical patterns, then build up to more complex joins.
 */
export const FEW_SHOT_EXAMPLES = [
    {
        question: "How many employees are there of each persona?",
        response: {
            sql: `SELECT persona, COUNT(*) AS count FROM "Employee" GROUP BY persona ORDER BY count DESC`,
            explanation: "Counts employees grouped by their persona role, sorted by largest group first.",
            suggestedChart: "bar",
            title: "Employees by Persona",
        },
    },
    {
        question: "Which employees own the most content?",
        response: {
            sql: `SELECT e."firstName" || ' ' || e."lastName" AS employee, COUNT(c.id) AS content_owned
                FROM "Employee" e
                JOIN "Content" c ON c."ownerId" = e.id
                GROUP BY e.id, e."firstName", e."lastName"
                ORDER BY content_owned DESC
                LIMIT 10`,
            explanation: "Finds the top 10 employees ranked by how many content items they own.",
            suggestedChart: "bar",
            title: "Top Content Owners",
        },
    },
    {
        question: "What content is expiring in the next 30 days?",
        response: {
            sql: `SELECT id, "displayName", "contentType", expiration, "targetPersona"
                FROM "Content"
                WHERE expiration IS NOT NULL
                  AND expiration BETWEEN NOW() AND NOW() + INTERVAL '30 days'
                ORDER BY expiration ASC
                LIMIT 100`,
            explanation: "Lists all content with an expiration date falling within the next 30 days, sorted by which expires soonest.",
            suggestedChart: "table",
            title: "Content Expiring Soon",
        },
    },
    {
        question: "How many service requests were created each month this year?",
        response: {
            sql: `SELECT date_trunc('month', created) AS month, COUNT(*) AS request_count
                FROM "ServiceRequest"
                WHERE created >= date_trunc('year', NOW())
                GROUP BY month
                ORDER BY month ASC`,
            explanation: "Groups service requests by the month they were created, for the current year.",
            suggestedChart: "line",
            title: "Service Requests Created per Month",
        },
    },
    {
        question: "What are the most-previewed pieces of content?",
        response: {
            sql: `SELECT c.id, c."displayName", c."contentType", COUNT(p."previewDate") AS preview_count
                FROM "Content" c
                JOIN "Preview" p ON p."previewedContentId" = c.id
                GROUP BY c.id, c."displayName", c."contentType"
                ORDER BY preview_count DESC
                LIMIT 10`,
            explanation: "Ranks content by total preview count across all employees.",
            suggestedChart: "bar",
            title: "Most-Previewed Content",
        },
    },
    {
        question: "How many open service requests does each employee have assigned?",
        response: {
            sql: `SELECT e."firstName" || ' ' || e."lastName" AS assignee, COUNT(sr.id) AS open_requests
                FROM "Employee" e
                JOIN "ServiceRequest" sr ON sr."assigneeId" = e.id
                WHERE sr.deadline IS NULL OR sr.deadline >= NOW()
                GROUP BY e.id, e."firstName", e."lastName"
                ORDER BY open_requests DESC`,
            explanation: "Counts service requests assigned to each employee, including only those with no deadline or a future deadline.",
            suggestedChart: "bar",
            title: "Open Service Requests by Assignee",
        },
    },
    {
        question: "Service requests created each day for the last 30 days",
        response: {
            sql: `WITH days AS (
  SELECT generate_series(
    date_trunc('day', NOW() - INTERVAL '30 days'),
    date_trunc('day', NOW()),
    INTERVAL '1 day'
  )::date AS day
)
SELECT days.day, COUNT(sr.id) AS request_count
FROM days
LEFT JOIN "ServiceRequest" sr ON date_trunc('day', sr.created)::date = days.day
GROUP BY days.day
ORDER BY days.day ASC`,
            explanation: "Counts service requests created each day in the last 30 days. Days with no requests are included as zero so the trend is complete.",
            suggestedChart: "line",
            title: "Service Requests per Day (Last 30 Days)",
        },
    },
] as const;