import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper} from "./helper";

const LOCK_TIMEOUT_MS = 2 * 60 * 1000;

export class Content {
    public static async updateContent(
        id: number,
        _name: string,
        _linkURL: string | null,
        _fileURI: string | null,
        _ownerId: number | null,
        _contentType: p.ContentType,
        _status: p.Status | null,
        _lastModified: Date,
        _expiration: Date | null,
        _targetPersona: string,
        _checkedOutById: number,
    ): Promise<p.Content> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_targetPersona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const _statusTyped: p.Status = Helper.statusHelper(_status)
        const content = await prisma.content.findUnique({
            where: { id: id },
        })

        if (!content) {
            throw new Error("Content not found")
        }

        if (content.checkedOutById !== _checkedOutById) {
            throw new Error("You do not have this content checked out.")
        }

        if (Content.isLockExpired(content.checkedOutAt)) {
            throw new Error("Your editing lock expired. Please close and try again.")
        }

        return prisma.content.update({
            where: {id: id},
            data: {
                displayName: _name,
                linkURL: _linkURL,
                fileURI: _fileURI,
                ownerId: _ownerId,
                contentType: _contentType,
                status: _statusTyped,
                lastModified: _lastModified,
                expiration: _expiration,
                targetPersona: _personaTyped,
                checkedOutById: null,
                checkedOutAt: null,
            }
        });
    }

    public static async createContent(
        _name: string,
        _linkURL: string | null,
        _fileURI: string | null,
        _ownerId: number | null,
        _contentType: p.ContentType,
        _status: p.Status | null,
        _lastModified: Date,
        _expiration: Date | null,
        _targetPersona: string,
    ): Promise<p.Content> {
        if (!_linkURL && !_fileURI) {
            throw new Error("Content must have either a linkURL or a fileURI")
        }
        if (_linkURL && _fileURI) {
            throw new Error("Content cannot have both a linkURL and a fileURI")
        }
        const _personaTyped: p.Persona | null = Helper.personaHelper(_targetPersona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const _statusTyped: p.Status = Helper.statusHelper(_status)
        return prisma.content.create({
            data: {
                displayName: _name,
                linkURL: _linkURL,
                fileURI: _fileURI,
                ownerId: _ownerId,
                contentType: _contentType,
                status: _statusTyped,
                lastModified: _lastModified,
                expiration: _expiration,
                targetPersona: _personaTyped,
            }
        })
    }

    public static async queryContentByBookmarkerId(bookmarkerId: number) {
        return prisma.content.findMany({
            include: {
                bookmarkedBy: {
                    where: { bookmarkerId: bookmarkerId }
                }
            }
        })
    }

    public static async deleteContent(id: number): Promise<void> {
        await prisma.content.delete({
            where: {id: id},
        })
    }

    public static async queryAllContent() {
        return prisma.content.findMany({
            include: {owner: true, checkedOutBy: true,},

        })
    }

    public static async queryContentByPersona(persona: string) {
        if (persona == "admin") {
            return this.queryAllContent()
        }
        const _personaTyped: p.Persona | null = Helper.personaHelper(persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        return prisma.content.findMany({
            where: {targetPersona: _personaTyped},
            include: {
                owner: true,
                checkedOutBy: true,
            },
        })
    }

    public static async queryContentById(_id: number): Promise<p.Content | null> {
        return prisma.content.findUnique({
            where: {id: _id},
            include: { owner: true, checkedOutBy: true }
        })
    }


    public static async checkoutContent(id: number, employeeID: number){
        const content = await prisma.content.findUnique({
            where: {id: id},
            include: {owner: true,
            checkedOutBy: true,}
        })
        if (!content) {
            throw new Error("Content not found");
        }
        const locked = content.checkedOutById !== null && content.checkedOutById !== employeeID;
        const expired = Content.isLockExpired(content.checkedOutAt);
        if (locked && !expired) {
            const first = content.checkedOutBy?.firstName ?? "Someone";
            const last = content.checkedOutBy?.lastName ?? "";
            throw new Error(`${first} ${last}`.trim() + " is currently modifying this content.");
        }
        return prisma.content.update({
            where: { id },
            data: {
                checkedOutById: employeeID,
                checkedOutAt: new Date(),
            },
            include: {
                owner: true,
                checkedOutBy: true,
            },
        });
    }

    private static isLockExpired(checkedOutAt: Date | null): boolean {
        if (!checkedOutAt) return true;
        return Date.now() - new Date(checkedOutAt).getTime() > LOCK_TIMEOUT_MS;
    }

    public static async checkinContent(id: number, employeeID: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { checkedOutById: null, checkedOutAt: null }
        })
    }

    public static async clearExpiredLocks(before: Date): Promise<void> {
        await prisma.content.updateMany({
            where: {
                checkedOutAt: { lt: before },
                checkedOutById: { not: null }
            },
            data: {
                checkedOutById: null,
                checkedOutAt: null,
            }
        })
    }
}
