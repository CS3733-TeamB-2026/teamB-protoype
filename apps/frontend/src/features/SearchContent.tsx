import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";
import { CollectionCard } from "@/components/shared/CollectionCard.tsx";
import { EmployeeCard } from "@/components/shared/EmployeeCard.tsx";
import { ServiceRequestCard } from "@/components/shared/ServiceRequestCard.tsx";
import { DottedBackground } from "@/components/shared/DottedBackground.tsx";
import type { SearchResult } from "@/lib/types.ts";

export default function SearchContent() {
    const { getAccessTokenSilently } = useAuth0();
    const [query, setQuery] = useState(window.localStorage.getItem("query") ?? "");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setResults(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Re-run the last query on mount if one was persisted in localStorage
    const [autoSearched, setAutoSearched] = useState(false);
    if (!autoSearched && !searched && window.localStorage.getItem("query")) {
        setAutoSearched(true);
        handleSearch();
    }

    return (
        <>
            <DottedBackground />

            <div className="max-w-3xl mx-auto px-4 py-10 relative">
                <h1 className="text-2xl font-semibold mb-6">Search</h1>

                <div className="flex gap-2 mb-8">
                    <Input
                        placeholder="Search content, collections, employees, service requests..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            window.localStorage.setItem("query", e.currentTarget.value);
                        }}
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

                {searched && !loading && results.length === 0 && (
                    <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
                )}

                <div className="flex flex-col gap-4">
                    {results.map((result, i) => {
                        switch (result.kind) {
                            case "content":
                                return <ContentItemCard key={`content-${result.item.id}`} item={result.item} />;
                            case "collection":
                                return <CollectionCard key={`collection-${result.item.id}`} collection={result.item} />;
                            case "employee":
                                return <EmployeeCard key={`employee-${result.item.id}`} employee={result.item} />;
                            case "servicereq":
                                return <ServiceRequestCard key={`servicereq-${result.item.id}`} servicereq={result.item} />;
                        }
                    })}
                </div>
            </div>
        </>
    );
}
