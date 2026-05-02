import { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

export type NLQueryResult = {
    sql: string;
    explanation: string;
    suggestedChart: "bar" | "line" | "pie" | "scorecard" | "table";
    title: string;
    rows: Record<string, unknown>[] | null;
    columns: string[];
    error?: string;
};

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
    history: { role: "user" | "assistant"; content: string }[];
}

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