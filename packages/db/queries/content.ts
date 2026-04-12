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
        _ownerID: number | null,
        _contentType: p.ContentType,
        _status: p.Status | null,
        _lastModified: Date,
        _expiration: Date | null,
        _targetPersona: string,
        _employeeID: number,
    ): Promise<void> {
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

        if (content.checkedOutBy !== _employeeID) {
            throw new Error("You do not have this content checked out.")
        }

        if (Content.isLockExpired(content.checkedOutAt)) {
            throw new Error("Your editing lock expired. Please close and try again.")
        }
        const updatedContent = await prisma.content.update({
            where: {id: id},
            data: {
                displayName: _name,
                linkURL: _linkURL,
                fileURI: _fileURI,
                ownerID: _ownerID,
                contentType: _contentType,
                status: _statusTyped,
                lastModified: _lastModified,
                expiration: _expiration,
                targetPersona: _personaTyped,
                checkedOutBy: null,
                checkedOutAt: null,
            }
        })
    }

    public static async createContent(
        _name: string,
        _linkURL: string | null,
        _fileURI: string | null,
        _ownerID: number | null,
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
                ownerID: _ownerID,
                contentType: _contentType,
                status: _statusTyped,
                lastModified: _lastModified,
                expiration: _expiration,
                targetPersona: _personaTyped,
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
            include: {owner: true, checkedOutByEmployee: true,},

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
                checkedOutByEmployee: true,
            },
        })
    }

    public static async queryContentById(_id: number): Promise<p.Content | null> {
        return prisma.content.findUnique({
            where: {id: _id}
        })
    }

    public static async queryContentByOwnerId(ownerId: number | null): Promise<p.Content | null> {
        let _ownerId
        if (ownerId === null) {
            _ownerId = JSON.parse(localStorage.getItem("user")!).id
        } else {
            _ownerId = ownerId
        }
        return prisma.content.findUnique({
            where: {id: _ownerId}
        })
    }

    public static async queryContentByName(name: string): Promise<p.Content | null> {
        return prisma.content.findFirst({
            where: {displayName: name}
            // TODO: Maybe add case insensitivity
            //  Perhaps better to grab ALL filenames so a fuzzy search may be done - Oscar
        })


    }
    public static async checkoutContent(id: number, employeeID: number){
        const content = await prisma.content.findUnique({
            where: {id: id},
            include: {owner: true,
            checkedOutByEmployee: true,}
        })
        if (!content) {
            throw new Error("Content not found");
        }
        const locked = content.checkedOutBy !== null && content.checkedOutBy !== employeeID;
        const expired = Content.isLockExpired(content.checkedOutAt);
        if (locked && !expired) {
            const first = content.checkedOutByEmployee?.firstName ?? "Someone";
            const last = content.checkedOutByEmployee?.lastName ?? "";
            throw new Error(`${first} ${last}`.trim() + " is currently modifying this content.");
        }
        return prisma.content.update({
            where: { id },
            data: {
                checkedOutBy: employeeID,
                checkedOutAt: new Date(),
            },
            include: {
                owner: true,
                checkedOutByEmployee: true,
            },
        });
    }

    private static isLockExpired(checkedOutAt: Date | null): boolean {
        if (!checkedOutAt) return true;
        return Date.now() - new Date(checkedOutAt).getTime() > LOCK_TIMEOUT_MS;
    }
}
