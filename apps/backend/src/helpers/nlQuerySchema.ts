import { z } from "zod";

/**
 * The structured output we require from the LLM for every NL→SQL request.
 *
 * OpenAI's structured outputs feature guarantees the response will match this
 * schema exactly — no JSON parsing errors, no missing fields, no surprises.
 */
export const NLQueryResponseSchema = z.object({
    sql: z
        .string()
        .describe("A single Postgres SELECT statement that answers the question."),
    explanation: z
        .string()
        .describe(
            "A 1-2 sentence plain-English description of what the query computes, " +
            "including any assumptions made about ambiguous parts of the question.",
        ),
    suggestedChart: z
        .enum(["bar", "line", "pie", "scorecard", "table"])
        .describe("The chart type best suited to display the results."),
    title: z
        .string()
        .describe(
            "A short title (under 60 chars) summarizing the result, suitable for " +
            "a chart header or saved-report name.",
        ),
});

export type NLQueryResponse = z.infer<typeof NLQueryResponseSchema>;

/**
 * Shape of the conversation history sent from the frontend.
 * Each turn is a previous question/answer pair.
 */
export const NLQueryHistoryMessageSchema = z.object({
    role: z.enum(["user","assistant"]),
    content: z.string()
})

export const NLQueryRequestSchema = z.object({
    question: z.string().min(1).max(500),
    history: z.array(NLQueryHistoryMessageSchema).max(10).default([])
})

export type NLQueryRequest = z.infer<typeof NLQueryRequestSchema>;