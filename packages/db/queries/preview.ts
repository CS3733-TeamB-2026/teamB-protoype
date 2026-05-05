import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";

/** Handles database operations for content preview (view) tracking. */
export class Preview {
    /**
     * Records that an employee previewed a piece of content.
     *
     * @param _previewerId The ID of the employee who viewed the content.
     * @param _previewedContentId The ID of the content that was viewed.
     * @returns The created preview record.
     */
    public static async createPreview(
        _previewerId: number,
        _previewedContentId: number,
    ): Promise<p.Preview> {
        return prisma.preview.create({
            data: {
                previewerId: _previewerId,
                previewedContentId: _previewedContentId,
            }
        })
    }

    /**
     * Returns all preview records for a given employee.
     *
     * @param previewerId The ID of the employee whose previews to fetch.
     * @param getContent When true, includes the full content record on each result.
     * @returns A list of preview records for the employee.
     */
    public static async queryPreviews(
        previewerId: number,
        getContent: boolean = false
    ): Promise<p.Preview[]> {
        return prisma.preview.findMany({
            where: { previewerId: previewerId },
            include: { previewedContent: getContent }
        })
    }

    /**
     * Returns the total view count for a piece of content.
     *
     * @param contentId The ID of the content to count views for.
     * @param previewerIds When provided, only count views from these employee IDs; otherwise count all views.
     * @returns The total number of matching preview records.
     */
    public static async queryHits(
        contentId: number,
        previewerIds?: number[]
    ): Promise<number> {
        let aggregations
        if(previewerIds) {
            aggregations = await prisma.preview.aggregate({
                _count: true,
                where: {
                    previewedContentId: contentId,
                    previewerId: { in: previewerIds }
                },
            })
        }
        else {
            aggregations = await prisma.preview.aggregate({
                _count: true,
                where: { previewedContentId: contentId },
            })
        }
        return aggregations._count
    }

    /**
     * Returns a view-count map for a batch of content IDs.
     * Content IDs with no views are included with a count of 0.
     *
     * @param contentIds The content IDs to count views for.
     * @returns A map of `{ contentId → viewCount }`.
     */
    public static async queryHitsByContentIds(
        contentIds: number[]
    ): Promise<Record<number, number>> {
        const aggregations = await prisma.preview.groupBy({
            by: ['previewedContentId'],
            where: { previewedContentId: { in: contentIds } },
            _count: true
        });
        
        const result: Record<number, number> = {};
        for (const id of contentIds) {
            result[id] = 0;
        }
        for (const agg of aggregations) {
            result[agg.previewedContentId] = agg._count;
        }
        return result;
    }
}
