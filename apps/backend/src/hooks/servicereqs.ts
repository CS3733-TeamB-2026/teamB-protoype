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

        const linkedContentId: number | null = payload.linkedContentId ?? null;
        const linkedCollectionId: number | null = linkedContentId ? null : (payload.linkedCollectionId ?? null);

        const sr = await q.ServiceReqs.createServiceReq(
            payload.name,
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            employee.id,
            payload.notes ?? null,
        );

        // Set the link on the content/collection side after creating the SR
        if (linkedContentId) await q.Content.setServiceRequest(linkedContentId, sr.id);
        else if (linkedCollectionId) await q.Collection.setServiceRequest(linkedCollectionId, sr.id);

        // Re-fetch with full relations so the response includes linkedContent/linkedCollection
        const result = await q.ServiceReqs.queryServiceReqById(sr.id);
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

        const linkedContentId: number | null = payload.linkedContentId ?? null;
        const linkedCollectionId: number | null = linkedContentId ? null : (payload.linkedCollectionId ?? null);

        // Clear the old link if the target is changing
        const oldContentId = existing.linkedContent?.id ?? null;
        const oldCollectionId = existing.linkedCollection?.id ?? null;
        if (oldContentId && oldContentId !== linkedContentId)
            await q.Content.setServiceRequest(oldContentId, null);
        if (oldCollectionId && oldCollectionId !== linkedCollectionId)
            await q.Collection.setServiceRequest(oldCollectionId, null);

        // Set the new link
        if (linkedContentId) await q.Content.setServiceRequest(linkedContentId, existing.id);
        else if (linkedCollectionId) await q.Collection.setServiceRequest(linkedCollectionId, existing.id);

        // ownerId is taken from the existing record — ownership cannot be transferred via this endpoint
        await q.ServiceReqs.updateServiceReq(
            payload.id,
            payload.name,
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            existing.ownerId,
            payload.notes ?? null,
        );

        const result = await q.ServiceReqs.queryServiceReqById(existing.id);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}

/** Returns the service request linked to the given content item (empty array if none). */
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

/** Returns the service request linked to the given collection (empty array if none). */
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

/**
 * Links a content item or collection to a service request by setting serviceRequestId
 * on the content/collection row. Validates that the target isn't already linked to a
 * different SR, and that private collections cannot be linked.
 */
export const linkServiceReq = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const srId = parseInt(req.params.id);
        const existing = await q.ServiceReqs.queryServiceReqById(srId);
        if (!existing) return res.status(404).json({ error: "Service request not found" });
        if (!isUserOrAdmin(existing.ownerId, employee))
            return res.status(403).json({ error: "Access denied" });

        const { linkedContentId = null, linkedCollectionId = null } = req.body;
        if (linkedContentId && linkedCollectionId)
            return res.status(400).json({ error: "Cannot link both a content item and a collection" });

        if (linkedCollectionId) {
            const col = await q.Collection.queryById(linkedCollectionId);
            if (!col.public)
                return res.status(400).json({ error: "Private collections cannot be linked to a service request" });
        }

        // Clear any previous link this SR had
        if (existing.linkedContent?.id) await q.Content.setServiceRequest(existing.linkedContent.id, null);
        if (existing.linkedCollection?.id) await q.Collection.setServiceRequest(existing.linkedCollection.id, null);

        if (linkedContentId) await q.Content.setServiceRequest(linkedContentId, srId);
        else if (linkedCollectionId) await q.Collection.setServiceRequest(linkedCollectionId, srId);

        const result = await q.ServiceReqs.queryServiceReqById(srId);
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

        // Clear links before deleting so content/collection rows are cleaned up
        if (existing.linkedContent?.id) await q.Content.setServiceRequest(existing.linkedContent.id, null);
        if (existing.linkedCollection?.id) await q.Collection.setServiceRequest(existing.linkedCollection.id, null);

        await q.ServiceReqs.deleteServiceReq(payload.id);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}
