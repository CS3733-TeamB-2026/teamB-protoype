export type Persona =
    | "underwriter"
    | "businessAnalyst"
    | "actuarialAnalyst"
    | "EXLOperator"
    | "businessOps"
    | "admin";

export type ContentType =
    | "reference"
    | "workflow";

export type ContentStatus =
    | "new"
    | "inProgress"
    | "complete";

/**
 * Bucketed expiration state used by the filter sidebar and `getExpirationStatus` in
 * `use-content-filters.ts`. Thresholds match `ExpirationBadge`: ≤0 days = expired,
 * 1–7 days = expiringSoon, >7 days = future, no expiration field = none.
 */
export type ExpirationStatus =
    | "expired"
    | "expiringSoon"
    | "future"
    | "none";

export type RequestType =
    | "reviewClaim"
    | "requestAdjuster"
    | "checkClaim";

export type Employee = {
    id: number;
    firstName: string;
    lastName: string;
    persona: Persona;
    profilePhotoURI: string;
}

// Matches the Content model from Prisma (with joined owner/checkedOutBy)
export type ContentItem = {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerId: number | null;
    owner: Employee | null;
    checkedOutById: number | null;
    checkedOutAt: string | null;
    checkedOutBy: Employee | null;
    created: string | null;
    lastModified: string;
    expiration: string | null;
    contentType: ContentType;
    targetPersona: Persona;
    status: ContentStatus;
    tags: string[];
    deleted: boolean;
    lastPreviewed: string;
}

export type BookmarkRecord = {
    bookmarkerId: number;
    bookmarkedContentId: number;
}

export type UrlPreview = {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
}

export type ServiceReq = {
    id: number;
    name: string;
    created: string;
    deadline: string;
    type: RequestType;
    ownerId: number;
    owner: Employee;
    assigneeId: number | null;
    assignee: Employee | null;
    notes: string | null;
    linkedContentId: number | null;
    linkedContent: ContentItem | null;
    linkedCollectionId: number | null;
    linkedCollection: Collection | null;
}
export type NotificationItem = {
    id: string;
    type: "change" | "ownership" | "expiration";
    contentId: number;
    contentName: string;
    triggeredBy: { id: number; firstName: string; lastName: string } | null;
    createdAt: string;
    dismissedAt?: string;
    metadata: {
        changedFields?: string[];
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        oldOwnerId?: number | null;
        newOwnerId?: number | null;
        oldOwnerName?: string | null;
        newOwnerName?: string | null;
        daysLeft?: number;
        hoursLeft?: number;
        expired?: boolean;
        threshold?: "3d" | "1h" | "expired";
    };
}
export type NotificationTab = "active" | "dismissed";

export type CollectionItem = {
    collectionId: number;
    contentId: number;
    position: number;
    content: ContentItem;
};

export type Collection = {
    id: number;
    displayName: string;
    ownerId: number;
    owner: Employee;
    public: boolean;
    items: CollectionItem[];
};

export type CollectionFavorite = {
    employeeId: number;
    collectionId: number;
};
