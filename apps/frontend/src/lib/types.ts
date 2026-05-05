export type Persona =
    | "underwriter"
    | "businessAnalyst"
    | "actuarialAnalyst"
    | "excelOperator"
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

/**
 * Mirrors the Prisma `Content` model with joined `owner` and `checkedOutBy` relations.
 *
 * `serviceRequestId` is the raw FK scalar; `serviceRequest` is the populated relation
 * and is only present on the detail response (`GET /api/content/:id`). List responses
 * from `GET /api/content` include `serviceRequestId` but leave `serviceRequest` null.
 *
 * An item is either a file (`fileURI`) or a link (`linkURL`), never both.
 */
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
    serviceRequestId: number | null;
    serviceRequest: ServiceReq | null;
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

/**
 * Mirrors the Prisma `ServiceRequest` model with joined relations.
 *
 * `linkedContent` and `linkedCollection` are back-relations resolved server-side —
 * the FK lives on those tables, not on ServiceRequest. Exactly one of them can be
 * non-null at a time (enforced by the `@unique` constraint on each FK column).
 */
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
    linkedContent: ContentItem | null;
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

/**
 * Mirrors the Prisma `Collection` model.
 *
 * `serviceRequestId` is the FK scalar; `serviceRequest` is populated only on the
 * detail response (`GET /api/collections/:id`). Private collections cannot have
 * a linked SR — the backend enforces this invariant in `updateCollection` and
 * `setCollectionServiceRequest`.
 */
export type Collection = {
    id: number;
    displayName: string;
    ownerId: number;
    owner: Employee;
    public: boolean;
    items: CollectionItem[];
    serviceRequestId: number | null;
    serviceRequest: ServiceReq | null;
};

export type CollectionFavorite = {
    employeeId: number;
    collectionId: number;
};

export type SearchResult =
    | { kind: "content";    similarity: number; item: ContentItem }
    | { kind: "collection"; similarity: number; item: Collection }
    | { kind: "employee";   similarity: number; item: Employee }
    | { kind: "servicereq"; similarity: number; item: ServiceReq };
