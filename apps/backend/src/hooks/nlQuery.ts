import type { Request, Response} from "express";
import { generateSQLFromQuestion } from "../services/nlQuery";
import {NLQueryRequestSchema, NLQueryResponseSchema} from "../helpers/nlQuerySchema";
import { z } from "zod";

/**
 * POST /api/nl-query
 * Translates a plain-English question into a SQL query (and chart suggestion)
 * via the OpenAI API.
 */
export async function generateNLQuery(req: Request, res: Response) {
    const parseResult = NLQueryRequestSchema.safeParse(req);
    if (!parseResult.success) {
        return res.status(400).json({
            error: "Invalid request body",
            details: z.treeifyError(parseResult.error),
        })
    }

    try {
        const result = await generateSQLFromQuestion(parseResult.data);

        return res.json({
            ...result,
            rows: null,
            columns: null
        });
    } catch (error) {
        console.error("[nl-query] generation failed:", error);
        return res.status(500).json({
            error: "Failed to generate SQL",
            message: error instanceof Error ? error.message : String(error)
        });
    }
}