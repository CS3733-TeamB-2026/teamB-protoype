import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover.tsx";
import { X, Plus } from "lucide-react";

interface Props {
    value: string[];
    onChange: (tags: string[]) => void;
    /** When false, the "Create" option is hidden — use for filter contexts. Default true. */
    creatable?: boolean;
    disabled?: boolean;
}

/** Normalizes a raw string to Title Case, collapsing internal whitespace. */
function toTitleCase(str: string): string {
    return str
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

/**
 * Chip-style tag input that combines selection from existing tags and free-form creation.
 *
 * Fetches the full tag list from `GET /api/content/tags` on mount and uses it to
 * populate suggestions. When `creatable` is false (filter contexts), the "Create" option
 * is suppressed so users can only pick from existing tags.
 *
 * Input is restricted to letters and spaces; title-casing is applied at the moment a tag
 * is committed (Enter, comma, or clicking a suggestion) — not while typing.
 *
 * Uses `PopoverAnchor` instead of `PopoverTrigger` so the dropdown is positioned relative
 * to the chip container without inheriting toggle-on-click behaviour. `onFocusOutside` is
 * suppressed to keep the native input focused while the suggestion list is open.
 */
export function TagInput({ value, onChange, creatable = true, disabled = false }: Props) {
    const [input, setInput] = useState("");
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/content/tags", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setAvailableTags(await res.json());
            } catch {
                // available tags are optional — silently degrade to create-only
            }
        };
        void fetchTags();
    }, [getAccessTokenSilently]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = e.target.value.replace(/[^a-zA-Z ]/g, "");
        setInput(cleaned);
        setOpen(true);
    };

    const addTag = (raw: string) => {
        const tag = toTitleCase(raw);
        if (!tag || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
        onChange([...value, tag]);
        setInput("");
        setOpen(false);
    };

    const removeTag = (tag: string) => {
        onChange(value.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault(); // prevent form submission and comma insertion
            if (input.trim()) addTag(input);
        }
        if (e.key === "Backspace" && !input && value.length > 0) {
            // Remove the last chip when the input is already empty, matching standard tag-input UX
            removeTag(value[value.length - 1]);
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const suggestions = availableTags.filter(
        (t) =>
            t.toLowerCase().includes(input.toLowerCase()) &&
            !value.some((v) => v.toLowerCase() === t.toLowerCase())
    );

    const titleCasedInput = input.trim() ? toTitleCase(input) : "";
    const showCreate =
        creatable &&
        !!titleCasedInput &&
        !value.some((t) => t.toLowerCase() === titleCasedInput.toLowerCase()) &&
        !availableTags.some((t) => t.toLowerCase() === titleCasedInput.toLowerCase());

    return (
        <Popover open={open && !disabled} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                {/* Chips and input share one wrapping box styled to look like an input field */}
                <div
                    className={`flex flex-wrap items-center gap-1.5 min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-text"}`}
                    onClick={(e) => !disabled && (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
                >
                    {value.map((tag) => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1 pr-1 shrink-0">
                            {tag}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                                    aria-label={`Remove ${tag}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    <input
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setOpen(true)}
                        disabled={disabled}
                        placeholder={value.length === 0 ? "Add a tag..." : ""}
                        className="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground text-sm disabled:cursor-not-allowed"
                    />
                </div>
            </PopoverAnchor>

            {(showCreate || suggestions.length > 0) && (
                <PopoverContent
                    align="start"
                    className="p-0 gap-0 w-(--radix-popover-anchor-width) overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onFocusOutside={(e) => e.preventDefault()}
                >
                    <div className="overflow-y-auto max-h-48 overscroll-contain">
                        {showCreate && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded-none border-b border-border font-medium h-9 px-3 text-sm"
                                // preventDefault keeps focus in the input so typing can continue after selection
                    onMouseDown={(e) => { e.preventDefault(); addTag(input); }}
                            >
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                Create &ldquo;{titleCasedInput}&rdquo;
                            </Button>
                        )}
                        {suggestions.map((tag) => (
                            <Button
                                key={tag}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded-none h-9 px-3 text-sm font-normal"
                                onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            )}
        </Popover>
    );
}