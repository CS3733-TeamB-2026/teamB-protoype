import 'dotenv/config'
import { expect, test, describe} from "vitest";
import {Content} from "@softeng-app/db";
{/*import { Employee } from "./queries/employee"*/}

{/*
describe('Employee Queries', () => {
    const john = {
        id: "2",
        firstName: "John",
        lastName: "Admin",
        targetPersona: "admin"
    }
    test('Employee John Admin Exists', () => {
        const result = 1+2
        expect(result).toBe(3)
    })

    test('Employee should properly intialize', () => {
        const result = 1+2
        expect(result).toBe(3)
    })
})
*/}


describe("Content tests", () => {
    const testContent = {
            name: "Test Document",
            linkURL: "https://example.com",
            fileURI: null,
            ownerID: 1,
            contentType: "reference" as const,
            status: "new" as const,
            lastModified: new Date("2026-04-08"),
            expiration: null,
            targetPersona: "underwriter"
        }
        test("content should properly create", async () => {
        const created = await Content.createContent(
            testContent.name,
                testContent.linkURL,
                testContent.fileURI,
                testContent.ownerID,
                testContent.contentType,
                testContent.status,
                testContent.lastModified,
                testContent.expiration,
                testContent.targetPersona
        )
            expect(created.displayName).toBe(testContent.name)
            expect(created.linkURL).toBe(testContent.linkURL)
            expect(created.ownerID).toBe(testContent.ownerID)
            expect(created.contentType).toBe(testContent.contentType)
            expect(created.targetPersona).toBe(testContent.targetPersona)
    await Content.deleteContent(created.id)
    })
})