import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Search, Loader2, FileText, BookMarked, User, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentItemCard } from "@/components/shared/ContentItemCard.tsx";
import { CollectionCard } from "@/components/shared/CollectionCard.tsx";
import { EmployeeCard } from "@/components/shared/EmployeeCard.tsx";
import { ServiceRequestCard } from "@/components/shared/ServiceRequestCard.tsx";
import { DottedBackground } from "@/components/shared/DottedBackground.tsx";
import type { SearchResult } from "@/lib/types.ts";

/**
 * Full-text semantic search page across all four entity types: content, collections,
 * employees, and service requests.
 *
 * The last query is persisted to localStorage so navigating away and back re-runs it
 * automatically. Results can be filtered client-side by kind using the pill toggles —
 * the API always returns all matching kinds and filtering is purely presentational.
 */
export default function GlobalSearch() {
    const { getAccessTokenSilently } = useAuth0();
    const [query, setQuery] = useState(window.localStorage.getItem("query") ?? ""); // restored on mount
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [visibleKinds, setVisibleKinds] = useState(new Set(["content", "collection", "employee", "servicereq"]));

    const toggleKind = (kind: string) =>
        setVisibleKinds((prev) => {
            const next = new Set(prev);
            if (next.has(kind)) next.delete(kind); else next.add(kind);
            return next;
        });

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

    // Trigger the persisted query once on mount without waiting for user interaction.
    // autoSearched guards against re-firing on every render while handleSearch is in flight.
    const [autoSearched, setAutoSearched] = useState(false);
    if (!autoSearched && !searched && window.localStorage.getItem("query")) {
        setAutoSearched(true);
        void handleSearch();
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
                        className="flex-1 h-12 text-lg pl-4 border-gray-700 focus-visible:ring-gray-500 bg-background"
                    />
                    <Button onClick={handleSearch} disabled={loading} className="h-12 w-12">
                        {loading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <Search className="w-5 h-5" />
                        }
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap mb-6">
                    {([
                        { kind: "content",    label: "Content",          icon: FileText     },
                        { kind: "collection", label: "Collections",      icon: BookMarked   },
                        { kind: "employee",   label: "Employees",        icon: User         },
                        { kind: "servicereq", label: "Service Requests", icon: ClipboardList },
                    ] as const).map(({ kind, label, icon: Icon }) => {
                        const active = visibleKinds.has(kind);
                        return (
                            <button
                                key={kind}
                                onClick={() => toggleKind(kind)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer
                                    ${active
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {searched && !loading && results.filter(r => visibleKinds.has(r.kind)).length === 0 && (
                    <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
                )}

                <div className="flex flex-col gap-4">
                    {results.filter(r => visibleKinds.has(r.kind)).map((result) => {
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
