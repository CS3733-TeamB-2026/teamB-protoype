import * as p from "../generated/prisma/client";

// Shared across all query classes that join employees — auth0Id intentionally excluded
// so it is never serialised into an API response.
export const employeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
    persona: true,
    profilePhotoURI: true,
} as const;

//exclude file embedding and vectors to save on cached egress
export const contentSelect = {
    id: true,
    linkURL: true,
    created: true,
    lastModified: true,
    expiration: true,
    status: true,
    contentType: true,
    targetPersona: true,
    displayName: true,
    fileURI: true,
    checkedOutAt: true,
    checkedOutById: true,
    ownerId: true,
    tags: true,
    deleted: true,
    serviceRequestId: true,
} as const

/**
 * Shared include for ServiceRequest relations — used by content/collection queryById
 * so that detail views receive the linked SR in one fetch. Defined here (not in
 * servicereqs.ts) to avoid circular imports across query classes.
 *
 * Does not nest linkedContent/linkedCollection inside the SR to avoid circular joins;
 * callers that already have the content/collection context don't need those fields.
 */
/**
 * Shared include for ServiceRequest relations — used by content/collection queryById
 * so that detail views receive the linked SR in one fetch. Defined here (not in
 * servicereqs.ts) to avoid circular imports: servicereqs.ts imports helper.ts, and
 * content.ts / collection.ts both import this constant without importing servicereqs.ts.
 *
 * `linkedContent` and `linkedCollection` are back-relations (the FK lives on those
 * tables), but the include syntax is identical to forward-relation includes.
 *
 * The nested collection items include is required because CollectionCard reads
 * `collection.items.length`. The SR's own linkedContent/linkedCollection are not
 * nested inside the returned collection to avoid circular join depth.
 */
export const srInclude = {
    owner: { select: employeeSelect },
    assignee: { select: employeeSelect },
    linkedContent: { select: contentSelect },
    linkedCollection: {
        include: {
            owner: { select: employeeSelect },
            items: {
                where: { content: { deleted: false } },
                orderBy: { position: "asc" as const },
                include: { content: { select: contentSelect } },
            },
        },
    },
} as const

export class Helper {
    public static personaHelper(_persona: string | null): p.Persona | null {
        if (_persona == "underwriter") {
            return p.Persona.underwriter
        } else if (_persona == "businessAnalyst") {
            return p.Persona.businessAnalyst
        } else if (_persona == "actuarialAnalyst") {
            return p.Persona.actuarialAnalyst
        } else if (_persona == "excelOperator") {
            return p.Persona.excelOperator
        } else if (_persona == "businessOps") {
            return p.Persona.businessOps
        } else if (_persona == "admin") {
            return p.Persona.admin
        } else {
            console.log(_persona);
            return null
            //TODO: figure out a default return
        }
    }

    public static statusHelper(_status: string | null): p.Status {
        if (_status == "new") {
            return p.Status.new
        } else if (_status == "inProgress") {
            return p.Status.inProgress
        } else if (_status == "complete") {
            return p.Status.complete
        } else {
            throw new Error("Invalid status: " + _status)
        }
    }

    public static requestHelper(_type: string | null): p.RequestType {
        if (_type == "reviewClaim") {
            return p.RequestType.reviewClaim
        } else if (_type == "requestAdjuster") {
            return p.RequestType.requestAdjuster
        } else if (_type == "checkClaim") {
            return p.RequestType.checkClaim
        } else {
            throw new Error(`Unknown request type: ${_type}`);
        }
    }
}