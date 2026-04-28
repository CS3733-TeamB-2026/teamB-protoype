import * as q from "@softeng-app/db";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";
import { isAdmin, isUserOrAdmin } from "../helpers/permissions";

/** Returns collections visible to the caller — all for admins, public+own for regular employees. */
export const getAllCollections = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collections = await q.Collection.queryAll(employee.id, isAdmin(employee));
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

/** Creates a collection owned by the caller — ownerId is derived from the JWT, not the request body. */
export const createCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const { displayName, isPublic } = req.body;
        const collection = await q.Collection.create(displayName, employee.id, isPublic ?? false);
        return res.status(201).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** Updates a collection; replaces the full ordered item list — send all contentIds, not a diff. Owner/admin only. */
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
        const updated = await q.Collection.update(
            collectionId,
            displayName,
            isPublic,
            ownerId ?? existing.ownerId,
            contentIds ?? [],
        );
        return res.status(200).json(updated);
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
