import * as q from "@softeng-app/db";
import {req, res} from "./types"
import { getEmployee } from "../helpers/getEmployee";
import { isUserOrAdmin } from "../helpers/permissions";

export const allServiceReqs = async (req: req, res: res) => {
    try {
        const servicereqs = await q.ServiceReqs.queryAllServiceReqs();
        return res.status(200).json(servicereqs);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const allAssignedReqs = async (req: req, res: res) => {
    try {
        const assigned = await q.ServiceReqs.queryAssignedServiceReqs();
        return res.status(200).json(assigned);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const createServiceReq = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const linkedContentId = payload.linkedContentId ?? null;
        const linkedCollectionId = linkedContentId ? null : (payload.linkedCollectionId ?? null);
        const result = await q.ServiceReqs.createServiceReq(
            payload.name,
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            employee.id,
            payload.notes ?? null,
            linkedContentId,
            linkedCollectionId,
        );
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}

export const updateServiceReq = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const existing = await q.ServiceReqs.queryServiceReqById(parseInt(payload.id));
        if (!existing) return res.status(404).json({ error: "Service request not found" });
        if (!isUserOrAdmin(existing.ownerId, employee))
            return res.status(403).json({ error: "Access denied" });

        const linkedContentId = payload.linkedContentId ?? null;
        const linkedCollectionId = linkedContentId ? null : (payload.linkedCollectionId ?? null);

        // ownerId is taken from the existing record — ownership cannot be transferred via this endpoint
        const result = await q.ServiceReqs.updateServiceReq(
            payload.id,
            payload.name,
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            existing.ownerId,
            payload.notes ?? null,
            linkedContentId,
            linkedCollectionId,
        );
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}

export const getServiceReqsByContentId = async (req: req, res: res) => {
    try {
        const contentId = parseInt(req.params.id);
        const servicereqs = await q.ServiceReqs.queryByContentId(contentId);
        return res.status(200).json(servicereqs);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getServiceReqsByCollectionId = async (req: req, res: res) => {
    try {
        const collectionId = parseInt(req.params.id);
        const servicereqs = await q.ServiceReqs.queryByCollectionId(collectionId);
        return res.status(200).json(servicereqs);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getUnlinkedServiceReqs = async (req: req, res: res) => {
    try {
        const servicereqs = await q.ServiceReqs.queryUnlinked();
        return res.status(200).json(servicereqs);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const linkServiceReq = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const id = parseInt(req.params.id);
        const existing = await q.ServiceReqs.queryServiceReqById(id);
        if (!existing) return res.status(404).json({ error: "Service request not found" });
        if (!isUserOrAdmin(existing.ownerId, employee))
            return res.status(403).json({ error: "Access denied" });

        const { linkedContentId = null, linkedCollectionId = null } = req.body;
        if (linkedContentId && linkedCollectionId)
            return res.status(400).json({ error: "Cannot link both a content item and a collection" });

        const result = await q.ServiceReqs.linkServiceReq(id, linkedContentId, linkedCollectionId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const deleteServiceReq = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const existing = await q.ServiceReqs.queryServiceReqById(parseInt(payload.id));
        if (!existing) return res.status(404).json({ error: "Service request not found" });
        if (!isUserOrAdmin(existing.ownerId, employee))
            return res.status(403).json({ error: "Access denied" });

        await q.ServiceReqs.deleteServiceReq(payload.id);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}