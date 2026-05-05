import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";

/** Handles database operations for content bookmarks (saved items per employee). */
export class Bookmark {
    /** Creates a bookmark linking an employee to a content item. */
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

    /**
     * Returns all bookmarks for an employee.
     * @param getContent When true, includes the full content record on each result.
     */
    public static async queryBookmarks(
        bookmarkerId: number,
        getContent: boolean = false
    ): Promise<p.Bookmark[]> {
        return prisma.bookmark.findMany({
            where: { bookmarkerId: bookmarkerId },
            include: { bookmarkedContent: getContent }
        })
    }

    /** Removes a bookmark by the composite key (bookmarkerId, bookmarkedContentId). */
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
