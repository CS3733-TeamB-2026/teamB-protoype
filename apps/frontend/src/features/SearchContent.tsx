import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Search, FileText, Link, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type SearchResult = {
    id: number;
    displayName: string;
    contentType: string;
    fileURI: string | null;
    linkURL: string | null;
    status: string;
    targetPersona: string;
    tags: string[];
    rank: number;
    snippet: string | null;
};

export default function SearchContent() {
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/content/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6">Search Content</h1>

            {/* Search bar */}
            <div className="flex gap-2 mb-8">
                <Input
                    placeholder="Search file contents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Search className="w-4 h-4" />
                    }
                </Button>
            </div>

            {/* Results */}
            {searched && !loading && results.length === 0 && (
                <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
            )}

            <div className="flex flex-col gap-4">
                {results.map((result) => (
                    <div
                        key={result.id}
                        onClick={() => navigate(`/file/${result.id}`)}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            {result.fileURI
                                ? <FileText className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                                : <Link className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h2 className="font-medium truncate">{result.displayName}</h2>
                                    <Badge variant="outline">{result.contentType}</Badge>
                                    <Badge variant="secondary">{result.targetPersona}</Badge>
                                </div>

                                {/* Snippet */}
                                {result.snippet && (
                                    <p
                                        className="text-sm text-muted-foreground line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: result.snippet }}
                                    />
                                )}

                                {/* Tags */}
                                {result.tags?.length > 0 && (
                                    <div className="flex gap-1 flex-wrap mt-2">
                                        {result.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}