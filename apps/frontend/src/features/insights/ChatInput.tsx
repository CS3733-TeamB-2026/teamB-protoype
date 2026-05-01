import { useState, type SyntheticEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    onSubmit: (question: string) => void;
    disabled?: boolean;
}

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
                className="resize-none"
            />
            <Button
                type="submit"
                disabled={disabled || !value.trim()}
                className="h-auto! w-15 bg-[#1B3A5C] hover:bg-[#1B3A5C]/90"
            >
                <Send className="h-4! w-4!" />
            </Button>
        </form>
    );
}

export default ChatInput;