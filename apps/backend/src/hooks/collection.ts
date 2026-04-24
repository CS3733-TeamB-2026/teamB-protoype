import * as q from "@softeng-app/db";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";

function isAdmin(persona: string) {
    return persona === "admin";
}

function canMutate(collection: { ownerId: number }, employeeId: number, persona: string) {
    return collection.ownerId === employeeId || isAdmin(persona);
}

export const getAllCollections = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collections = await q.Collection.queryAll(employee.id, isAdmin(employee.persona));
        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getCollectionById = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const collection = await q.Collection.queryById(collectionId);

        if (!collection.public && !canMutate(collection, employee.id, employee.persona)) {
            return res.status(403).json({ error: "Access denied" });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

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

export const updateCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);

        if (!canMutate(existing, employee.id, employee.persona)) {
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

export const deleteCollection = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);
        const existing = await q.Collection.queryById(collectionId);

        if (!canMutate(existing, employee.id, employee.persona)) {
            return res.status(403).json({ error: "Access denied" });
        }

        await q.Collection.delete(collectionId);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

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

export const addFavorite = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const collectionId = parseInt(req.params.id);

        // Prevent favoriting a private collection the employee can't see
        const collection = await q.Collection.queryById(collectionId);
        if (!collection.public && !canMutate(collection, employee.id, employee.persona)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const favorite = await q.Collection.addFavorite(collectionId, employee.id);
        return res.status(201).json(favorite);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

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
