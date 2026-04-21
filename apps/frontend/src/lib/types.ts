export type ContentType = "reference" | "workflow";

export type ContentStatus = "new" | "inProgress" | "complete";

export type Persona =
    | "underwriter"
    | "businessAnalyst"
    | "actuarialAnalyst"
    | "EXLOperator"
    | "businessOps"
    | "admin";

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
    contentType: ContentType;
    targetPersona: Persona;
    status: ContentStatus;
    tags: string[];
}

// Y'all I couldn't find a way to do it as a part of ContentItem, sorry. -Ricardo
export type DocType =
    | "office"
    | "plain text"
    | "video"
    | "audio"
    | "html"
    | "zip"
    | "images"
    | "links";

export interface BookmarkRecord {
    bookmarkerId: number;
    bookmarkedContentId: number;
}

export type Employee = {
    firstName: string;
    lastName: string;
    id: number;
    persona: Persona;
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
