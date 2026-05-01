import { zodResponseFormat } from "openai/helpers/zod";
import { buildSystemPrompt } from "@softeng-app/db";
import { prismaReadOnly } from "@softeng-app/db";
import { openai, NL_QUERY_MODEL } from "../helpers/openai";
import {
    NLQueryResponseSchema,
    type NLQueryResponse,
    type NLQueryRequest,
} from "../helpers/nlQuerySchema";
import { validateSQL, isNoDataResponse } from "../helpers/sqlSafety";

/**
 * Cache the system prompt — it's a static string built from schema + examples.
 * No reason to rebuild it on every request.
 */
const SYSTEM_PROMPT = buildSystemPrompt();

const MAX_ROWS_RETURNED = 1000;

const MAX_RETRY_ATTEMPTS = 1; //Keep retries to 1 as to avoid large token usage.

export type NLQueryFullResult = NLQueryResponse & {
    rows: Record<string, unknown>[] | null;
    columns: string[] | null;
    error?: string;
}

/**
 * Calls OpenAI to generate SQL, then validates and (if safe) executes it
 * against the read-only Postgres user. Returns the LLM's structured output
 * plus actual data rows, or an error explanation.
 */
export async function answerQuestion(
    request: NLQueryRequest,
): Promise<NLQueryFullResult> {
    let llmResponse = await generateSQLFromQuestion(request);

    //No data responses, returns error message from llm
    const noData = isNoDataResponse(llmResponse.sql);
    if (noData.isNoData) {
        return {
            ...llmResponse,
            rows: null,
            columns: null,
            error: noData.message
        };
    }

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        //Validate before sending to db
        const validation = validateSQL(llmResponse.sql);
        if (!validation.ok) {
            return {
                ...llmResponse,
                rows: null,
                columns: null,
                error: validation.reason
            }
        }

        //Execute on READ-ONLY client
        try {
            const rows = await prismaReadOnly.$queryRawUnsafe<Record<string, unknown>[]>(
                llmResponse.sql,
            );
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
            const truncated = rows.slice(0, MAX_ROWS_RETURNED);

            return {
                ...llmResponse,
                rows: serializeRows(truncated),
                columns
            };
        } catch (err) {
            const errMessage = err instanceof Error ? err.message : String(err);

            //If we can retry, ask LLM to fix it
            if (attempt < MAX_RETRY_ATTEMPTS) {
                console.log(
                    `[nl-query] Query failed, retrying (attempt ${attempt + 1}):`,
                    errMessage,
                );
                llmResponse = await generateSQLFromQuestion({
                    question: `The previous query failed with this error:\n\n${errMessage}\n\nPlease fix the query. Original question: ${request.question}`,
                    history: request.history,
                });
                continue;
            }

            //Out of retries
            return {
                ...llmResponse,
                rows: null,
                columns: null,
                error: `Query failed after ${MAX_RETRY_ATTEMPTS + 1} attempts: ${err instanceof Error ? err.message : String(err)}`
            };
        }
    }

    throw new Error("Unreachable retry loop exit");
}

/**
 * Postgres returns BigInt for some numeric types (COUNT, etc). JSON.stringify
 * cannot serialize BigInt, so convert to Number for safe transmission.
 */
function serializeRows(
    rows: Record<string, unknown>[],
): Record<string, unknown>[] {
    return rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === "bigint") {
                out[key] = Number(value);
            } else if (value instanceof Date) {
                out[key] = value.toISOString();
            } else {
                out[key] = value;
            }
        }
        return out;
    });
}

/**
 * Calls OpenAI to generate a SQL query for the given question.
 * Returns parsed, validated structured output.
 *
 * Does NOT execute the SQL — that happens separately after safety validation.
 */
export async function generateSQLFromQuestion(
    request: NLQueryRequest,
): Promise<NLQueryResponse> {

    console.log("Calling OpenAI with model:", NL_QUERY_MODEL);

    const completion = await openai.chat.completions.parse({
        model: NL_QUERY_MODEL,
        max_completion_tokens: 1024,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...request.history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: "user", content: request.question }
        ],
        response_format: zodResponseFormat(NLQueryResponseSchema, "nl_query"),
    })

    console.log("Tokens used:", completion.usage);

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
        // The .parse() helper guarantees parsed will be present unless the model
        // refused to answer. Refusals are surfaced via .refusal on the message.
        const refusal = completion.choices[0]?.message.refusal;
        throw new Error(
            refusal
                ? `Model refused: ${refusal}`
                : `Model returned no parsed output`
        )
    }

    return parsed;

}