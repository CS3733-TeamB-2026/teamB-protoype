import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";
import {DottedBackground} from "@/components/shared/DottedBackground.tsx";

export default function SearchContent() {
    const { getAccessTokenSilently } = useAuth0();
    const [query, setQuery] = useState(window.localStorage.getItem("query") ?? "");
    const [results, setResults] = useState<[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    window.localStorage.setItem("", query);

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

    const updateSearched = () => {
        if (searched) return;
        if (window.localStorage.getItem("query")) {
            handleSearch();
        }
        return ""
    }

    return (
        <>
            <DottedBackground/>

            <div className="max-w-3xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-semibold mb-6">Search Content</h1>

                {/* Search bar */}
                <div className="flex gap-2 mb-8">
                    <Input
                        placeholder="Search file contents..."
                        value={query}
                        onChange={(e) => {setQuery(e.target.value); window.localStorage.setItem("query", e.currentTarget.value)}}
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
                {updateSearched()}
                {searched && !loading && results.length === 0 && (
                    <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
                )}

                <div className="flex flex-col gap-4">
                    {results.map((result) => (
                        <ContentItemCard item={result} />
                    ))}
                </div>
            </div>
        </>
    );
}