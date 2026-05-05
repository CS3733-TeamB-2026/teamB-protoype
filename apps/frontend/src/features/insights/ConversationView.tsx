import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { type ChatTurn } from "@/hooks/use-nl-query";
import { ResultRenderer } from "./ResultRenderer";

type Props = {
    turns: ChatTurn[];
    isLoading: boolean;
}

/**
 * Scrollable thread of user/assistant turns for the Insights chat.
 * Scrolls to the bottom whenever a new turn is added or loading state changes.
 * Delegates rendering to `TurnDisplay` and shows `LoadingTurn` while a query is in-flight.
 */
function ConversationView({ turns, isLoading }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    //Scroll to latest turn
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ turns.length, isLoading ]);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {turns.map((turn, i) => (
                <TurnDisplay key={i} turn={turn} />
            ))}
            {isLoading && <LoadingTurn />}
            <div ref={bottomRef} />
        </div>
    )
}

/** Renders a single chat turn: user bubble, assistant result card, or error card. */
function TurnDisplay({ turn }: { turn : ChatTurn }) {
    if (turn.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-primary-dark shadow-lg px-4 py-2 text-white">
                    {turn.content}
                </div>
            </div>
        );
    }

    //Assistant turn
    if (turn.isError) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 shadow-lg text-sm text-destructive">
                {turn.content}
            </div>
        );
    }

    if (turn.result) {
        return <ResultRenderer result={turn.result} />;
    }

    return null;
}

function LoadingTurn() {
    return (
        <div className="w-fit">
            <div className="space-y-3 shadow-lg bg-card p-4 rounded-[12px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking…</span>
                </div>
            </div>
        </div>
    );
}

export default ConversationView;