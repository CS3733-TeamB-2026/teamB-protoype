import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NLQueryResult } from "@/hooks/use-nl-query";
import ResultChart from "./ResultChart";
import ResultTable from "./ResultTable";
import ResultScorecard from "./ResultScorecard"

type Props = { result: NLQueryResult };

export function ResultRenderer({result}: Props) {
    const [showSQL, setShowSQL] = useState(false);

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
                    <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">
                        <code>{result.sql}</code>
                    </pre>
                )}
            </div>
        </div>
    );
}