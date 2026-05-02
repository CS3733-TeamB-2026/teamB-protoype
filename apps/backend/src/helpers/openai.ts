import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is missing");
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

/**
 * The model used for NL→SQL generation.
 * gpt-5.4-mini is the cost/quality sweet spot — ~$0.005 per request,
 * very capable at SQL, and supports structured outputs natively.
 */
export const NL_QUERY_MODEL = "gpt-5.4-mini";