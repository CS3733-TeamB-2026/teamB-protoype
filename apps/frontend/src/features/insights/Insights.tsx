import { useState } from 'react';
import { Sparkles } from "lucide-react";
import ChatInput from "@/features/insights/ChatInput";
import ConversationView from "@/features/insights/ConversationView";
import EmptyState from "@/features/insights/EmptyState";
import { useNLQuery, type ChatTurn } from "@/hooks/use-nl-query";

function InsightsPage() {
    const [conversation, setConversation] = useState<ChatTurn[]>([]);
    const { ask, isLoading } = useNLQuery();

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
        <div className="flex h-full flex-col">
            <header className="border-b px-6 py-4 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#1B3A5C]" />
                    <h1 className="text-xl font-semibold">Insights</h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ask anything about your content, employees, or service requests.
                </p>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                {conversation.length === 0 ? (
                    <EmptyState onSelectSuggestion={handleSubmit} />
                ) : (
                    <ConversationView turns={conversation} isLoading={isLoading} />
                )}
            </div>

            <div className="border-t px-6 py-4 bg-card shadow-lg">
                <div className="mx-40">
                    <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
                </div>
            </div>
        </div>
    );
}

export default InsightsPage;