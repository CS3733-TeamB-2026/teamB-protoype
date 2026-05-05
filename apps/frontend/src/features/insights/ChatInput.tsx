import { useState, type SyntheticEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    onSubmit: (question: string) => void;
    disabled?: boolean;
}

/**
 * Auto-growing textarea with a send button for the Insights chat interface.
 * Submits on Enter (without Shift), clears input after submission, and
 * prevents submission of whitespace-only messages.
 */
function ChatInput({ onSubmit, disabled }: Props) {
    const [value, setValue] = useState("");

    function submit(e?: SyntheticEvent) {
        e?.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSubmit(trimmed);
        setValue("");
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    }

    return (
        <form onSubmit={submit} className="flex items-stretch gap-2">
            <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your data…"
                rows={2}
                disabled={disabled}
                className="resize-none rounded-xl focus-visible:ring-0 focus-visible:border-input"
            />
            <Button
                type="submit"
                disabled={disabled || !value.trim()}
                className="h-auto! w-15 bg-linear-to-br from-primary to-primary-light rounded-xl transition-opacity hover:opacity-85"
            >
                <Send className="h-4! w-4!" />
            </Button>
        </form>
    );
}

export default ChatInput;