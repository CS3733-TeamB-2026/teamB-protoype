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
        const _personaTyped: p.Persona = Helper.personaHelper(_targetPersona)
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
        const _personaTyped: p.Persona = Helper.personaHelper(_targetPersona)
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
        const deletedContent = await prisma.content.delete({
            where: {id: id},
        })
    }

    public static async queryAllContent(): Promise<p.Content[]> {
        return prisma.content.findMany({})
    }

    public static async queryContentById(id: number): Promise<p.Content | null> {
        return prisma.content.findUnique({
            where: {id: id}
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
