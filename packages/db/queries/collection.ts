import { prisma } from "../lib/prisma";
import { employeeSelect, srInclude } from "./helper";

// Items have no guaranteed DB order, so position must always be applied here
const itemsInclude = {
    items: {
        where: { content: { deleted: false } },
        orderBy: { position: "asc" as const },
        include: { content: true },
    },
} as const;

/**
 * Query class for the Collection model.
 *
 * Permission checks (ownership, admin access, private visibility) are the
 * responsibility of the backend hook, not this class. These methods trust
 * that the caller has already verified the requesting employee is allowed
 * to perform the operation.
 *
 * Favorites are kept separate from collection queries — use queryFavorites,
 * addFavorite, and removeFavorite rather than inlining them into queryAll/queryById.
 */
export class Collection {
    /**
     * Returns all public collections plus all collections owned by the given employee.
     * Pass `isAdmin=true` to return every collection regardless of visibility.
     *
     * `unlinkedSR=true` restricts to collections whose `serviceRequestId` is null —
     * used by the SR creation form so that already-linked collections don't appear
     * as candidates. Unlike the SR back-relation null-check (`{ linkedCollection: { is: null } }`),
     * this uses a plain `serviceRequestId: null` because Collection owns the FK directly.
     */
    public static async queryAll(employeeId: number, isAdmin: boolean, unlinkedSR = false) {
        return prisma.collection.findMany({
            where: {
                ...(isAdmin ? {} : { OR: [{ public: true }, { ownerId: employeeId }] }),
                ...(unlinkedSR ? { serviceRequestId: null } : {}),
            },
            include: {
                owner: { select: employeeSelect },
                ...itemsInclude,
            },
            orderBy: { id: "asc" },
        });
    }

    /** Returns a single collection with all joined content items and its linked service request. */
    public static async queryById(collectionId: number) {
        return prisma.collection.findUniqueOrThrow({
            where: { id: collectionId },
            include: {
                owner: { select: employeeSelect },
                ...itemsInclude,
                serviceRequest: { include: srInclude },
            },
        });
    }

    public static async queryByOwnerId(ownerId: number) {
        return prisma.collection.findMany({
            where: { ownerId: ownerId },
            include: {
                owner: { select: employeeSelect },
                ...itemsInclude,
            }
        });
    }

    /** Creates a new collection with the given name and owner. */
    public static async create(displayName: string, ownerId: number, isPublic: boolean) {
        return prisma.collection.create({
            data: { displayName, ownerId, public: isPublic },
            include: {
                owner: { select: employeeSelect },
                ...itemsInclude,
            },
        });
    }

    /** Updates name, visibility, owner, and replaces the full ordered item list.
     *  Positions are assigned by array index. All fields are optional except collectionId. */
    public static async update(
        collectionId: number,
        displayName: string,
        isPublic: boolean,
        ownerId: number,
        contentIds: number[],
    ) {
        return prisma.$transaction(async (tx) => {
            await tx.collectionItem.deleteMany({ where: { collectionId } });

            if (contentIds.length > 0) {
                await tx.collectionItem.createMany({
                    data: contentIds.map((contentId, index) => ({
                        collectionId,
                        contentId,
                        position: index,
                    })),
                });
            }

            return tx.collection.update({
                where: { id: collectionId },
                data: { displayName, public: isPublic, ownerId },
                include: {
                    owner: { select: employeeSelect },
                    ...itemsInclude,
                },
            });
        });
    }

    /** Appends items to a collection, skipping IDs already present. New items are positioned after the last existing item. */
    public static async appendItems(collectionId: number, contentIds: number[]) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.collectionItem.findMany({
                where: { collectionId },
                select: { contentId: true, position: true },
            });
            const existingIds = new Set(existing.map((i) => i.contentId));
            const toAdd = contentIds.filter((id) => !existingIds.has(id));
            const maxPosition = existing.length > 0 ? Math.max(...existing.map((i) => i.position)) : -1;

            if (toAdd.length > 0) {
                await tx.collectionItem.createMany({
                    data: toAdd.map((contentId, index) => ({
                        collectionId,
                        contentId,
                        position: maxPosition + 1 + index,
                    })),
                });
            }

            return tx.collection.findUnique({
                where: { id: collectionId },
                include: {
                    owner: { select: employeeSelect },
                    ...itemsInclude,
                },
            });
        });
    }

    /** Cascades to CollectionItem and CollectionFavorite via schema onDelete. */
    public static async delete(collectionId: number) {
        await prisma.collection.delete({ where: { id: collectionId } });
    }

    /** Adds a favorite for given collection and employee. */
    public static async addFavorite(collectionId: number, employeeId: number) {
        return prisma.collectionFavorite.create({
            data: { collectionId, employeeId },
        });
    }

    /** Removes a favorite. */
    public static async removeFavorite(collectionId: number, employeeId: number) {
        await prisma.collectionFavorite.delete({
            where: { employeeId_collectionId: { employeeId, collectionId } },
        });
    }

    /**
     * Links a collection to a service request, or clears the link when `serviceRequestId` is null.
     *
     * Collection owns the FK (`serviceRequestId`), so the link is set here rather than on
     * the ServiceRequest row. The DB enforces `@unique` on this column — attempting to link
     * a collection that already points at a different SR will throw a Prisma unique-constraint
     * error; callers must clear the old link first.
     */
    public static async setServiceRequest(collectionId: number, serviceRequestId: number | null) {
        return prisma.collection.update({
            where: { id: collectionId },
            data: { serviceRequestId },
        });
    }

    /** Returns all collections that contain the given content item, filtered by visibility. */
    public static async queryByContentId(contentId: number, employeeId: number, isAdmin: boolean) {
        return prisma.collection.findMany({
            where: {
                items: { some: { contentId } },
                ...(isAdmin ? {} : {
                    OR: [{ public: true }, { ownerId: employeeId }],
                }),
            },
            include: {
                owner: { select: employeeSelect },
                ...itemsInclude,
            },
            orderBy: { id: "asc" },
        });
    }

    /** Returns all collections the employee has favorited, with full item data. */
    public static async queryFavorites(employeeId: number) {
        return prisma.collectionFavorite.findMany({
            where: { employeeId },
            include: {
                collection: {
                    include: {
                        owner: { select: employeeSelect },
                        ...itemsInclude,
                    },
                },
            },
        });
    }
}