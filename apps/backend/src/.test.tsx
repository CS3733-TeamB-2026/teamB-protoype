import {convertToJSON, parseCSV} from "../src/bin/parser.ts";
import { expect, test, describe} from "vitest";

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



describe ("Content tests", () => {
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
        test("content should properly create"), async () => {
        const created = await Cont
    }
})