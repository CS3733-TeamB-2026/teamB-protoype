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
            <div
                className="mx-auto mb-8 h-20 w-20 rounded-full p-[2px] shadow-[0_6px_20px_-8px] shadow-primary-light/55"
                style={{
                    background:
                        "conic-gradient(from 220deg, var(--primary-light), color-mix(in oklch, var(--primary-light) 60%, transparent), color-mix(in oklch, var(--primary-light) 25%, transparent), var(--primary-light))",
                }}
            >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>

            {/* Title with subtle blue underglow + gradient text */}
            <div className="relative inline-block">
                <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 h-[120%] w-[90%] blur-[32px]"
                    style={{
                        background:
                            "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary-light) 35%, transparent) 0%, color-mix(in oklch, var(--primary-light) 12%, transparent) 45%, transparent 75%)",
                    }}
                />
                <h1 className="relative z-[1] pb-2 text-6xl font-semibold bg-linear-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    Welcome to Insights.
                </h1>
            </div>

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
                        className="gap-2 rounded-full bg-card shadow-sm"
                        style={{
                            borderColor:
                                "color-mix(in oklch, var(--primary) 50%, transparent)",
                        }}
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