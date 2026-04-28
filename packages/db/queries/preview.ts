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

    public static async updatePreview(
        _previewerId: number,
        _previewedContentId: number,
    ): Promise<p.Preview> {
        return prisma.preview.put({
            data: {
                previewerId: _previewerId,
                previewedContentId: _previewedContentId,
            },
            where: {
                previewerId_previewedContentId: {
                    previewerId: _previewerId,
                    previewedContentId: _previewedContentId,
                },
            }
        })
    }

}