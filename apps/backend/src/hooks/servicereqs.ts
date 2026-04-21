import * as q from "@softeng-app/db";
import {req, res} from "./types"

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
        const result = await q.ServiceReqs.createServiceReq(
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            payload.ownerId
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
        const result = await q.ServiceReqs.updateServiceReq(
            payload.id,
            payload.created,
            payload.deadline,
            payload.type,
            payload.assigneeId,
            payload.ownerId
        )
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}

export const deleteServiceReq = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const result = await q.ServiceReqs.deleteServiceReq(payload.id)
        return res.status(204).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}