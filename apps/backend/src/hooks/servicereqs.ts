import * as q from "@softeng-app/db";
import express from "express";
const app = express();
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
        const id = parseInt(req.query.id as string);
        const assigned = await q.ServiceReqs.queryAssignedServiceReqs();
        return res.status(200).json(assigned);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};