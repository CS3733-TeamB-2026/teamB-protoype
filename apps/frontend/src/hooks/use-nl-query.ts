import { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

/** Full response from POST /api/nl-query, including executed rows. */
export type NLQueryResult = {
    sql: string;
    explanation: string;
    suggestedChart: "bar" | "line" | "pie" | "scorecard" | "table";
    title: string;
    rows: Record<string, unknown>[] | null;
    columns: string[];
    /** Present when the LLM returned a no-data response or the SQL failed validation/execution. */
    error?: string;
};

/** One turn in the Insights conversation thread. */
export type ChatTurn =
    | { role: "user"; content: string }
    | {
        role: "assistant";
        content: string;
        result?: NLQueryResult;
        isError?: boolean;
        summaryForHistory?: string;
    };

type AskInput = {
    question: string;
    /** Alternating user/assistant pairs from the current session, used for follow-up context. */
    history: { role: "user" | "assistant"; content: string }[];
}

/**
 * Sends a plain-English question to the NL-query backend and returns the
 * structured result (SQL, explanation, chart type, and data rows).
 *
 * `isLoading` is true while the request is in-flight. Throws on non-2xx
 * responses so the caller can catch and render an error turn.
 */
export function useNLQuery() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { getAccessTokenSilently } = useAuth0();

    async function ask(input: AskInput): Promise<NLQueryResult> {
        setIsLoading(true);
        try {
            console.log("[nl-query] sending:", JSON.stringify(input, null, 2));
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/nl-query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(input),
            })
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || `Request failed: ${res.status}`);
            }

            return await res.json();
        } finally {
            setIsLoading(false);
        }
    }

    return { ask, isLoading };
}