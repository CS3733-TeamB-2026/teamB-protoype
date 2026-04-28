import * as q from "@softeng-app/db";
import {req, res} from "./types"
import { getEmployee } from "../helpers/getEmployee";

export const getPreviews = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const previews = await q.Preview.queryPreviews(employeeId);
        return res.status(200).json(previews);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const addPreview = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const contentId = parseInt(req.params.contentId);
        const preview = await q.Preview.createPreview(employeeId, contentId);
        return res.status(201).json(preview);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const previewAgain = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const contentId = parseInt(req.params.contentId);
        const preview = await q.Preview.updatePreview(employeeId, contentId);
        return res.status(200).json(preview)
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};