import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper} from "./helper";

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
    ): Promise<void> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_targetPersona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const _statusTyped: p.Status = Helper.statusHelper(_status)
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
            include: {owner: true},
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
            include: {owner: true},
        })
    }

    public static async queryContentById(_id: number): Promise<p.Content | null> {
        return prisma.content.findUnique({
            where: {id: _id}
        })
    }

    public static async queryContentByOwnerId(ownerId: number | null): Promise<p.Content | null> {
        let _ownerId
        if (ownerId === null){
            _ownerId = JSON.parse(localStorage.getItem("user")!).id
        }
        else{
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
}
