import * as q from "@softeng-app/db";
import { generateEmbedding } from "../../lib/embeddings";
import { req, res } from "./types";
import { getEmployee } from "../helpers/getEmployee";
import { isAdmin } from "../helpers/permissions";

/**
 * Unified semantic search across all four entity types.
 * Fans out to each `semanticSearch` in parallel, tags each result with its
 * entity kind and similarity score, then returns the top 20 by similarity.
 */
export const unifiedSearch = async (req: req, res: res) => {
    const { q: searchQuery } = req.query;
    if (!searchQuery || typeof searchQuery !== "string") {
        return res.status(400).json({ error: "Search query is required" });
    }

    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const admin = isAdmin(employee);
        const queryVector = await generateEmbedding(searchQuery);

        const [content, collections, employees, serviceReqs] = await Promise.all([
            q.Content.semanticSearch(queryVector),
            q.Collection.semanticSearch(queryVector, employee.id, admin),
            q.Employee.semanticSearch(queryVector),
            q.ServiceReqs.semanticSearch(queryVector),
        ]);

        const results = [
            ...content.map((item: any) => ({ kind: "content" as const, similarity: item.similarity ?? 0, item })),
            ...collections.map((item: any) => ({ kind: "collection" as const, similarity: item.similarity ?? 0, item })),
            ...employees.map((item: any) => ({ kind: "employee" as const, similarity: item.similarity ?? 0, item })),
            ...serviceReqs.map((item: any) => ({ kind: "servicereq" as const, similarity: item.similarity ?? 0, item })),
        ];

        results.sort((a, b) => b.similarity - a.similarity);

        return res.status(200).json(results.slice(0, 20));
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};
