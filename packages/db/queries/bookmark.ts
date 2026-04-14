import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";

export class Bookmark {
    public static async createBookmark(
        _bookmarkerId: number,
        _bookmarkedContentId: number,
    ): Promise<p.Bookmark> {
        return prisma.bookmark.create({
            data: {
                bookmarkerId: _bookmarkerId,
                bookmarkedContentId: _bookmarkedContentId,
            }
        })
    }

    public static async queryBookmarks(
        bookmarkerId: number,
        getContent: boolean = false
    ): Promise<p.Bookmark[]> {
        return prisma.bookmark.findMany({
            where: { bookmarkerId: bookmarkerId },
            include: { bookmarkedContent: getContent }
        })
    }

    public static async deleteBookmark(
        _bookmarkerId: number,
        _bookmarkedContentId: number,
    ): Promise<p.Bookmark> {
        return prisma.bookmark.delete({
            where: {
                bookmarkerId_bookmarkedContentId: {
                    bookmarkerId: _bookmarkerId,
                    bookmarkedContentId: _bookmarkedContentId,
                },
            }
        })
    }

}
