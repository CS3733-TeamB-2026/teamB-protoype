import * as q from "@softeng-app/db";
import { generateEmbedding } from "../../lib/embeddings";
import { buildCollectionEmbeddingInput } from "../../lib/embeddingInputs";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";
import { isAdmin, isUserOrAdmin } from "../helpers/permissions";

function scheduleCollectionEmbedding(id: number, displayName: string) {
    setImmediate(async () => {
        try {
            const embedding = await generateEmbedding(buildCollectionEmbeddingInput(displayName));
            await q.Collection.updateEmbedding(id, embedding);
        } catch (err) {
            console.error(`[background] Failed to embed collection id=${id}:`, err);
        }
    });
}

/** Returns collections visible to the caller — all for admins, public+own for regular employees.
 *  Pass ?unlinkedSR=true to restrict to collections not yet linked to a service request. */
export const getAllCollections = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const unlinkedSR = req.query.unlinkedSR === "true";
        const collections = await q.Collection.queryAll(employee.id, isAdmin(employee), unlinkedSR);
        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Fetches a collection by ID; 403s if it's private and the caller isn't the owner or an admin. */
export const getCollectionById = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const collection = await q.Collection.queryById(collectionId);

        if (!collection.public && !isUserOrAdmin(collection.ownerId, employee)) {
            return res.status(403).json({ error: "Access denied" });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getCollectionByOwnerId = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collections = await q.Collection.queryByOwnerId(employee.id);

        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Creates a collection owned by the caller — ownerId is derived from the JWT, not the request body. */
export const createCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const { displayName, isPublic } = req.body;
        const collection = await q.Collection.create(displayName, employee.id, isPublic ?? false);
        scheduleCollectionEmbedding(collection.id, collection.displayName);
        return res.status(201).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Updates a collection; replaces the full ordered item list — send all contentIds, not a diff. Owner/admin only.
 *  If the collection is made private, any linked service request is automatically unlinked. */
export const updateCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);

        if (!isUserOrAdmin(existing.ownerId, employee)) {
            return res.status(403).json({ error: "Access denied" });
        }
        const { displayName, isPublic, ownerId, contentIds } = req.body;

        // Private collections cannot be linked to SRs; sever the link before the update
        // so the DB constraint (private collections must have serviceRequestId = null) is not violated.
        if (existing.public && !isPublic && existing.serviceRequestId != null) {
            await q.Collection.setServiceRequest(collectionId, null);
        }

        const updated = await q.Collection.update(
            collectionId,
            displayName,
            isPublic,
            ownerId ?? existing.ownerId,
            contentIds ?? [],
        );
        scheduleCollectionEmbedding(updated.id, updated.displayName);
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Sets the service request linked to a collection. Validates the collection is public. Owner/admin only. */
export const setCollectionServiceRequest = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);
        if (!isUserOrAdmin(existing.ownerId, employee))
            return res.status(403).json({ error: "Access denied" });

        const { serviceRequestId } = req.body;

        if (serviceRequestId != null && !existing.public)
            return res.status(400).json({ error: "Private collections cannot be linked to a service request" });

        await q.Collection.setServiceRequest(collectionId, serviceRequestId ?? null);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Deletes a collection; cascades to CollectionItem and CollectionFavorite rows. Owner/admin only. */
export const deleteCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);

        if (!isUserOrAdmin(existing.ownerId, employee)) {
            return res.status(403).json({ error: "Access denied" });
        }

        await q.Collection.delete(collectionId);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Returns all collections containing the given content item, filtered by the caller's visibility. */
export const getCollectionsByContentId = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const contentId = parseInt(req.params.id);
        const collections = await q.Collection.queryByContentId(contentId, employee.id, isAdmin(employee));
        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Returns the caller's favorited collections with full item data. */
export const getFavorites = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const favorites = await q.Collection.queryFavorites(employee.id);
        return res.status(200).json(favorites);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Adds a favorite after verifying the caller can see the collection — prevents bookmarking inaccessible private collections. */
export const addFavorite = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);

        // Prevent favoriting a private collection the employee can't see
        const collection = await q.Collection.queryById(collectionId);
        if (!collection.public && !isUserOrAdmin(collection.ownerId, employee)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const favorite = await q.Collection.addFavorite(collectionId, employee.id);
        return res.status(201).json(favorite);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Appends items to a collection without replacing the full list; silently deduplicates. Owner/admin only. */
export const appendItemsToCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);

        if (!isUserOrAdmin(existing.ownerId, employee)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { contentIds } = req.body;
        if (!Array.isArray(contentIds)) {
            return res.status(400).json({ error: "contentIds must be an array" });
        }

        const updated = await q.Collection.appendItems(collectionId, contentIds);
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Removes a favorite; no visibility check — employees can always un-favorite even if a collection was made private. */
export const removeFavorite = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        await q.Collection.removeFavorite(collectionId, employee.id);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};
