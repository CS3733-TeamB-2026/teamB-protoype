import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
    "How many employees of each persona?",
    "What content is expiring in the next 30 days?",
    "Top 5 most-previewed content items",
    "Who has the most overdue service requests?",
    "Service requests created each day for the past month",
    "Which employees own the most content?",
];

type Props = {
    onSelectSuggestion: (question: string) => void;
};

function EmptyState({ onSelectSuggestion }: Props) {
    return (
        <div className="mx-auto max-w-3xl py-24 text-center">
            {/* Sparkle mark */}
            <div className="mx-auto mb-8 h-20 w-20 rounded-full p-[2px] bg-conic from-primary-light via-primary to-primary-light shadow-lg shadow-primary-light/40">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>

            {/* Title with gradient text */}
            <h1 className="pb-2 text-6xl font-semibold bg-linear-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Welcome to Insights.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
                Ask anything about your content, employees, and service requests in plain English.
            </p>

            {/* Pills */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                    <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectSuggestion(suggestion)}
                        className="gap-2 rounded-full bg-card shadow-sm border-primary/50 hover:bg-primary/10 hover:text-foreground dark:hover:bg-primary/30"
                    >
                        <span className="text-primary">•</span>
                        {suggestion}
                    </Button>
                ))}
            </div>
        </div>
    );
}

export default EmptyState;