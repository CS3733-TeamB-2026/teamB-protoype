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
        <div className="mx-auto max-w-2xl py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B3A5C]/10">
                <Sparkles className="h-6 w-6 text-[#1B3A5C]" />
            </div>
            <h2 className="text-lg font-semibold">Ask anything about your data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Use plain English to query your content, employees, and service requests.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                    <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectSuggestion(suggestion)}
                        className="rounded-full"
                    >
                        {suggestion}
                    </Button>
                ))}
            </div>
        </div>
    );
}

export default EmptyState;