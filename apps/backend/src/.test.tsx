import 'dotenv/config'
import { expect, test, describe} from "vitest";
import * as login from './hooks/login'
import * as content from './hooks/content'
import * as employee from './hooks/employee'
import { Content, Employee } from "@softeng-app/db";
{/*import { Employee } from "./queries/employee"*/}

describe("Employee tests", () => {
    const testEmployee = {
        id: 101010 as const,
        firstName: "January" as const,
        lastName: "February" as const,
        persona: "underwriter"
    }
    test("employee should properly create", async () => {
        const created: { id: number; firstName: string; lastName: string; persona: string} = await Employee.createEmployee(
            testEmployee.id,
            testEmployee.firstName,
            testEmployee.lastName,
            testEmployee.persona,
        )
            expect(created.id).toBe(testEmployee.id)
            expect(created.firstName).toBe(testEmployee.firstName)
            expect(created.lastName).toBe(testEmployee.lastName,)
            expect(created.persona).toBe(testEmployee.persona)
        await Employee.deleteEmployee(created.id)
    })
})


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

describe ("Login tests", () => {
    type loginData = {  // John Admin; admin admin
        userName: string,
        employeeID: number,
        passwordHash: string
    }
    let result: loginData
    const expected: loginData = {
        userName: "admin",
        employeeID: 1,
        passwordHash: "$2b$10$Vnf06p8rhA.xjyqfCJWHV.GLezvD4fv7WxJuBAkC1vMGtv2fzAkd6",
    }
    const testLogin = {
        username: "admin",
        password: "admin"
    }
    test("admin admin with id 1 exists"), async () => {
        await login.tryLogin(testLogin, result)
        expect(result).toEqual(expected)
    }
})