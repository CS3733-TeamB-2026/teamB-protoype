import * as q from "@softeng-app/db";
import {req, res} from "./types"
import { getEmployee } from "../helpers/getEmployee";

/** GET /api/bookmarks — returns all bookmarks for the authenticated employee. */
export const getBookmarks = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const bookmarks = await q.Bookmark.queryBookmarks(employeeId);
        return res.status(200).json(bookmarks);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** POST /api/content/:contentId/bookmark — adds a bookmark linking the authenticated employee to a content item. */
export const addBookmark = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const contentId = parseInt(req.params.contentId);
        const bookmark = await q.Bookmark.createBookmark(employeeId, contentId);
        return res.status(201).json(bookmark);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

/** DELETE /api/content/:contentId/bookmark — removes the bookmark for the authenticated employee and given content item. */
export const removeBookmark = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        const employeeId = employee.id;

        const contentId = parseInt(req.params.contentId);
        await q.Bookmark.deleteBookmark(employeeId, contentId);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};