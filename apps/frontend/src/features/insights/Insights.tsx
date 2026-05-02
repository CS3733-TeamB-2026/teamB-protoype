import { useState } from 'react';
import ChatInput from "@/features/insights/ChatInput";
import ConversationView from "@/features/insights/ConversationView";
import EmptyState from "@/features/insights/EmptyState";
import { useNLQuery, type ChatTurn } from "@/hooks/use-nl-query";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function InsightsPage() {
    const [conversation, setConversation] = useState<ChatTurn[]>([]);
    const { ask, isLoading } = useNLQuery();

    usePageTitle("Insights");

    async function handleSubmit(question: string) {
        const userTurn: ChatTurn = { role: "user", content: question }
        setConversation((prev) => [...prev, userTurn]);

        try {
            const result = await ask({
                question,
                history: conversation
                    .filter((t) => !(t.role === "assistant" && t.isError))  // skip errored assistant turns
                    .map((t) =>
                        t.role === "user"
                            ? { role: "user" as const, content: t.content ?? "" }
                            : {
                                role: "assistant" as const,
                                content: t.result?.explanation ?? t.content ?? "",
                            },
                    ),
            });
            setConversation((prev) => [
                ...prev,
                { role: "assistant", content: "", result },
            ]);
        } catch (err) {
            setConversation((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: err instanceof Error ? err.message : "Something went wrong.",
                    isError: true
                }
            ])

        }
    }

    return (
        <div className="mx-auto flex h-[calc(100vh-76px)] w-full flex-col">

            <div
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{
                    backgroundImage: `radial-gradient(circle, oklch(0.343 0.07 252.435 / 0.15) 1px, transparent 2px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative flex-1 min-h-0">
                <div className="absolute inset-0 overflow-y-auto px-6 pt-10 pb-45 min-h-0 scroll-pb-100">
                    {conversation.length === 0 ? (
                        <EmptyState onSelectSuggestion={handleSubmit} />
                    ) : (
                        <ConversationView turns={conversation} isLoading={isLoading} />
                    )}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl">
                    <div className="border mb-5 p-3 bg-card shadow-lg rounded-xl w-full max-w-6xl mx-auto">
                        <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
                    </div>
                </div>

            </div>

        </div>
    );
}

export default InsightsPage;