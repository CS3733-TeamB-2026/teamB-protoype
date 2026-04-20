import {useState,} from "react";
import type {ContentItem, BookmarkRecord} from "@/lib/types.ts";

export type ContentTab = "all" | "bookmarks";

export function useContentFilters(
    content: ContentItem[],
    bookmarks: BookmarkRecord[],
    currentUserId: number | undefined,
) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<ContentTab>("all");
    // First pass: filter by the search box (case-insensitive display name match).
    const searchedContent = content.filter((item) =>
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    /**
     * Checkbox state for the filter sidebar. An empty array for a multi-select
     * field means "no filter applied" (all values pass). The two boolean flags
     * are additional single-checkbox filters.
     */
    const [advancedFilters, setAdvancedFilters] = useState({
        status: [] as Array<"new" | "inProgress" | "complete">,
        contentType: [] as Array<"reference" | "workflow">,
        persona: [] as Array<"underwriter" | "businessAnalyst" | "admin">,
        bookmarkedOnly: false,
        ownedByMe: false,
    });

    /**
     * Clears all advanced filters.
     */
    const clearAdvancedFilters = () => setAdvancedFilters({
        status: [],
        contentType: [],
        persona: [],
        bookmarkedOnly: false,
        ownedByMe: false,
    });

    // Second pass: apply the sidebar checkboxes on top of the search results.
    // Each condition is skipped (passes everything) when no options are selected.
    const filteredContent = searchedContent.filter((item) => {
        const matchesStatus =
            advancedFilters.status.length === 0 ||
            (item.status !== null && advancedFilters.status.includes(item.status));

        const matchesContentType =
            advancedFilters.contentType.length === 0 ||
            advancedFilters.contentType.includes(item.contentType);

        const matchesPersona =
            advancedFilters.persona.length === 0 ||
            advancedFilters.persona.includes(item.targetPersona);

// On the bookmarks tab, always require bookmarked.
// Otherwise, respect the bookmarkedOnly checkbox.
        const requireBookmark = activeTab === "bookmarks" || advancedFilters.bookmarkedOnly;
        const matchesBookmark =
            !requireBookmark || bookmarks.some((b) => b.bookmarkedContentId === item.id);

        const matchesOwner =
            !advancedFilters.ownedByMe || item.ownerId === currentUserId;

        return (
            matchesStatus &&
            matchesContentType &&
            matchesPersona &&
            matchesBookmark &&
            matchesOwner
        );
    });

    // Total number of active filter conditions — shown in the "Filters (N)" button label.
    const activeFilterCount =
        advancedFilters.status.length +
        advancedFilters.contentType.length +
        advancedFilters.persona.length +
        (advancedFilters.bookmarkedOnly ? 1 : 0) +
        (advancedFilters.ownedByMe ? 1 : 0);

    return {
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        advancedFilters,
        setAdvancedFilters,
        clearAdvancedFilters,
        activeFilterCount,
        filteredContent,
    };
}