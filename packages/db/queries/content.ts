import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper} from "./helper";


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
        _tags: string[],
        _checkedOutById: number,
        _textContent: string | null = null,
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
                tags: _tags,
                textContent: _textContent,
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
        _tags: string[] = [],
        _textContent: string | null = null,
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
                tags: _tags,
                textContent: _textContent,
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
            include: {owner: true, checkedOutBy: true,}
        })
        if (!content) {
            throw new Error("Content not found");
        }
        const locked = content.checkedOutById !== null && content.checkedOutById !== employeeID;
        if (locked) {
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

    public static async checkinContent(id: number, employeeID: number): Promise<void> {
        await prisma.content.update({
            where: { id },
            data: { checkedOutById: null, checkedOutAt: null }
        })
    }

    //helper function - only used by other hit count queries
    private static async getHitsArray(id: number): Promise<Array<number>> {
        const emptyArray: number[] = [] //used to ensure that return value gets defined as a number array and not null
        return (await prisma.content.findUnique({
            where: { id: id },
            select: { hits: true }
        }))?.hits ?? emptyArray
    }

    //Note: if we want to add more queries like these, we should abstract them to reuse more code with a .filter()
    public static async getTotalHitCount(id: number): Promise<number> {
        const hits = await Content.getHitsArray(id)
        return hits.length
    }

    public static async getEmployeeHitCount(id: number, employeeId: number): Promise<number> {
        const hits = await Content.getHitsArray(id)
        return hits.filter((empId) => empId == employeeId).length
    }

    public static async getEmployeeGroupHitCount(id: number, employeeIds: number[]): Promise<number> {
        const hits = await Content.getHitsArray(id)
        return hits.filter((empId) => employeeIds.includes(empId)).length
    }

    public static async addHit(id: number, employeeId: number): Promise<void> {
        const hits = await Content.getHitsArray(id)
        hits.push(employeeId)
        await prisma.content.update({
            where: {id: id},
            data: { hits: hits }
        })
    }

    public static async searchContent(query: string): Promise<p.Content[]> {
        const results = await prisma.$queryRaw<p.Content[]>`
        SELECT
            id,
            "displayName",
            "linkURL",
            "fileURI",
            "contentType",
            "status",
            "targetPersona",
            "tags",
            "lastModified",
            "expiration",
            ts_rank("searchVector", plainto_tsquery('english', ${query})) AS rank,
            ts_headline(
                'english',
                "textContent",
                plainto_tsquery('english', ${query}),
                'MaxWords=50, MinWords=20'
            ) AS snippet
        FROM "Content"
        WHERE "searchVector" @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT 20;
    `;
        return results;
    }
}
