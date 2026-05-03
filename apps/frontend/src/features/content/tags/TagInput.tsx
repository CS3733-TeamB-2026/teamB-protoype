import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
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

function TagChip({ tag, onRemove, onSelect, disabled }: {
    tag: string;
    onRemove?: () => void;
    /** When provided, the whole chip is clickable (suggestion mode — no X button). */
    onSelect?: (e: React.MouseEvent) => void;
    disabled?: boolean;
}) {
    return (
        <Badge
            variant="outline"
            className={`flex items-center gap-1 pr-1 shrink-0 ${onSelect ? "cursor-pointer hover:bg-accent/20" : ""}`}
            onMouseDown={onSelect}
        >
            {tag}
            {onRemove && !disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                    aria-label={`Remove ${tag}`}
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </Badge>
    );
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
 * Uses a plain absolute-positioned dropdown (same pattern as EmployeePicker) rather than
 * a Radix Popover so it renders in the same DOM tree and scrolls correctly inside dialogs.
 */
export function TagInput({ value, onChange, creatable = true, disabled = false }: Props) {
    const [input, setInput] = useState("");
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
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

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

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

    const showDropdown = !disabled && open && (showCreate || suggestions.length > 0);

    return (
        <div ref={containerRef} className="relative">
            {/* Chips and input share one wrapping box styled to look like an input field */}
            <div
                className={`flex flex-wrap items-center gap-1.5 min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-text"}`}
                onClick={(e) => !disabled && (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
            >
                {value.map((tag) => (
                    <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} disabled={disabled} />
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

            {showDropdown && (
                <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-popover shadow-md overflow-hidden">
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
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2">
                                {suggestions.map((tag) => (
                                    <TagChip
                                        key={tag}
                                        tag={tag}
                                        onSelect={(e) => { e.preventDefault(); addTag(tag); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
