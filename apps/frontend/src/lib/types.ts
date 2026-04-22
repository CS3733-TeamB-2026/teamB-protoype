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

// Matches the Content model from Prisma (with joined owner)
export type ContentItem = {
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


export type BookmarkRecord = {
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

export type ServiceReq = {
    id: number;
    created: string;
    deadline: string;
    type: string;
    assignee: number;
    owner: number;
}
