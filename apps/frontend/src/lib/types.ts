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
    lastModified: string;
    expiration: string | null;
    contentType: ContentType;
    targetPersona: Persona;
    status: ContentStatus;
    tags: string[];
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
    type: string;
    ownerId: number;
    owner: Employee;
    assigneeId: number | null;
    assignee: Employee | null;
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
