import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NLQueryResult } from "@/hooks/use-nl-query";
import ResultChart from "./ResultChart";
import ResultTable from "./ResultTable";
import ResultScorecard from "./ResultScorecard"

type Props = { result: NLQueryResult };

/**
 * Renders one assistant turn from the NL-query pipeline.
 *
 * Dispatches to the appropriate visualization based on `result.suggestedChart`:
 * - `scorecard` → single aggregate value (`ResultScorecard`)
 * - `bar | line | pie` → Recharts chart (`ResultChart`)
 * - `table` → scrollable data table (`ResultTable`)
 *
 * Always shows the title, explanation, and an expandable SQL block.
 * Renders an inline error message when `result.error` is set.
 */
export function ResultRenderer({result}: Props) {
    const [showSQL, setShowSQL] = useState(false);

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard API can fail in insecure contexts (non-https) or if the user denies permission
            // silently no-op; the worst case is the icon just doesn't change
        }
    };

    //Error case
    if (result.error) {
        return (
            <div className="rounded-lg shadow-lg border bg-muted/30 p-4">
                <p className="text-sm">{result.error}</p>
            </div>
        );
    }

    const hasData = result.rows && result.rows.length > 0;

    return (
        <div className="space-y-3 shadow-lg bg-card p-4 rounded-[12px]">
            <div>
                <h3 className="font-semibold">{result.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {result.explanation}
                </p>
            </div>

            {hasData ? (
                <>
                    {result.suggestedChart === "scorecard" && (
                        <ResultScorecard rows={result.rows!} columns={result.columns!} />
                    )}
                    {result.suggestedChart === "bar" && (
                        <ResultChart
                            type="bar"
                            rows={result.rows!}
                            columns={result.columns!}
                        />
                    )}
                    {result.suggestedChart === "line" && (
                        <ResultChart
                            type="line"
                            rows={result.rows!}
                            columns={result.columns!}
                        />
                    )}
                    {result.suggestedChart === "pie" && (
                        <ResultChart
                            type="pie"
                            rows={result.rows!}
                            columns={result.columns!}
                        />
                    )}
                    {result.suggestedChart === "table" && (
                        <ResultTable rows={result.rows!} columns={result.columns!} />
                    )}
                </>
            ) : (
                <p className="text-sm text-muted-foreground">No results found.</p>
            )}

            <div className="border-t pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSQL((v) => !v)}
                    className="text-xs"
                >
                    {showSQL ? (
                        <>
                            <ChevronUp className="mr-1 h-3 w-3" />
                            Hide SQL
                        </>
                    ) : (
                        <>
                            <ChevronDown className="mr-1 h-3 w-3" />
                            Show SQL
                        </>
                    )}
                </Button>
                {showSQL && (
                    <div className="relative mt-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="absolute top-1 right-1 h-7 w-7 hover:text-primary-light"
                            aria-label={copied ? "Copied" : "Copy SQL"}
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                        <pre className="overflow-x-auto rounded bg-muted p-3 pr-10 text-xs">
                    <code>{result.sql}</code>
                </pre>
                    </div>
                )}
            </div>
        </div>
    );
}