import { zodResponseFormat } from "openai/helpers/zod";
import { buildSystemPrompt } from "@softeng-app/db";

import { openai, NL_QUERY_MODEL } from "../helpers/openai";
import {
    NLQueryResponseSchema,
    type NLQueryResponse,
    type NLQueryRequest,
} from "../helpers/nlQuerySchema";

/**
 * Cache the system prompt — it's a static string built from schema + examples.
 * No reason to rebuild it on every request.
 */
const SYSTEM_PROMPT = buildSystemPrompt();

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