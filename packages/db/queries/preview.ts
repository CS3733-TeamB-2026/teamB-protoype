import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";

export class Preview {
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

    public static async queryPreviews(
        previewerId: number,
        getContent: boolean = false
    ): Promise<p.Preview[]> {
        return prisma.preview.findMany({
            where: { previewerId: previewerId },
            include: { previewedContent: getContent }
        })
    }

    /* previewerId: Fill array with employeeIds to get hits for only those employees or leave null for all hits */
    public static async queryHits(
        contentId: number,
        previewerIds: number[]
    ): Promise<number> {
        let aggregations
        if(previewerIds.length <= 0) {
            aggregations = await prisma.preview.aggregate({
                _count: true,
                where: { previewedContentId: contentId },
            })
        }
        else {
            aggregations = await prisma.preview.aggregate({
                _count: true,
                where: {
                    previewedContentId: contentId,
                    previewerId: { in: previewerIds }
                },
            })
        }
        return aggregations._count
    }
}