import { useRef, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import { resolveAllowedType, CATEGORY_COLORS } from "@/lib/mime.ts";

interface Props {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string | null;
    accept?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePickerCard({ file, onChange, error, accept }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [opening, setOpening] = useState(false);

    const handleClear = () => {
        if (inputRef.current) inputRef.current.value = "";
        onChange(null);
    };

    const handleClick = () => {
        setOpening(true);
        inputRef.current?.click();
        // The file dialog doesn't fire any reliable close event, so listen for the
        // window regaining focus — that fires whether a file was picked or cancelled.
        window.addEventListener("focus", () => setOpening(false), { once: true });
    };

    return (
        <div className="flex flex-col gap-1">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    setOpening(false);
                    onChange(e.target.files?.[0] ?? null);
                }}
            />

            {file ? (
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        {(() => {
                            const entry = resolveAllowedType(file.type, file.name);
                            const category = entry?.category ?? "other";
                            const colors = CATEGORY_COLORS[category];
                            return (
                                <div className={`flex items-center justify-center w-10 h-10 rounded ${colors.badge} shrink-0`}>
                                    <ContentIcon category={category} isLink={false} className="w-5 h-5" />
                                </div>
                            );
                        })()}
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {resolveAllowedType(file.type, file.name)?.label ?? "Unknown"} &middot; {formatFileSize(file.size)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={handleClear}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2 border-dashed"
                    onClick={handleClick}
                    disabled={opening}
                >
                    {opening
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Upload className="w-4 h-4" />
                    }
                    {opening ? "Opening…" : "Choose file…"}
                </Button>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}