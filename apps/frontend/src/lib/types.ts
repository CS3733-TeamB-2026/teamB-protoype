// Matches the Content model from Prisma (with joined owner)
export interface ContentItem {
    id: number;
    displayName: string;
    linkURL: string | null;
    fileURI: string | null;
    ownerId: number | null;
    owner: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    checkedOutById: number | null;
    checkedOutAt: string | null;
    checkedOutBy: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    lastModified: string;
    expiration: string | null;
    contentType: "reference" | "workflow";
    targetPersona: "underwriter" | "businessAnalyst" | "admin";
    status: "new" | "inProgress" | "complete" | null;
    tags: string[];
}

export interface BookmarkRecord {
    bookmarkerId: number;
    bookmarkedContentId: number;
}

export type Employee = {
    firstName: string;
    lastName: string;
    id: number;
    persona: string;
    profilePhotoURI: string;
    login?: {
        userName: string;
    };
}

export type UrlPreview = {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
}
