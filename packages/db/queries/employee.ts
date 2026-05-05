import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect} from "./helper";
import { embeddingToSql } from '../lib/embeddings';

/** Query class for the `Employee` table. */
export class Employee {
    /** Returns all employees using the shared `employeeSelect` projection (no auth0Id). */
    public static async queryAllEmployees() {
        return prisma.employee.findMany({ select: employeeSelect })
    }

    /** Semantic vector search over all employees. Returns up to `limit` results with `similarity` score (0–1). */
    public static async semanticSearch(queryVector: number[], limit = 20) {
        const embeddingStr = embeddingToSql(queryVector);

        const rows = await prisma.$queryRaw<{ id: number; similarity: number }[]>`
            SELECT id, 1 - (embedding <=> ${embeddingStr}::vector) AS similarity
            FROM "Employee"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `;

        const ids = rows.map(r => r.id);
        const similarityMap = new Map(rows.map(r => [r.id, Number(r.similarity)]));

        const employees = await prisma.employee.findMany({
            where: { id: { in: ids } },
            select: employeeSelect,
        });

        return employees
            .map(e => ({ ...e, similarity: similarityMap.get(e.id) ?? 0 }))
            .sort((a, b) => b.similarity - a.similarity);
    }

    /** Stores a pre-computed embedding vector for the given employee. */
    public static async updateEmbedding(id: number, embedding: number[]): Promise<void> {
        await prisma.$executeRaw`
            UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${id}
        `;
    }

    /** Returns a single employee by internal ID, or null if not found. */
    public static async queryEmployeeById(id: number) {
        return prisma.employee.findUnique({
            where: { id },
            select: employeeSelect,
        })
    }

    /** Updates name and persona for an existing employee. Throws if persona string is unrecognized. */
    public static async updateEmployee(id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<p.Employee> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const result = await prisma.employee.update({
            where: {id: id},
            data: {
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            },
        });

        return result;
    }

    /** Hard-deletes an employee record. */
    public static async deleteEmployee(id: number): Promise<void> {
        await prisma.employee.delete({
            where: {id: id},
        })
    }

    /** Looks up an employee by their Auth0 subject ID. Used during JWT validation to resolve the caller. */
    public static async queryEmployeeByAuth( auth0Id: string ) {
        return prisma.employee.findUnique({
            where: { auth0Id: auth0Id }
        })
    }

    /** Creates an employee record with a caller-supplied ID (used for seeding/import). */
    public static async createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<p.Employee> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const result = await prisma.employee.create({
            data: {
                id: _id,
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            }
        });

        return result;
    }

    /** Creates an employee record and binds it to an Auth0 subject ID on first login. */
    public static async createEmployeeWithAuth0(_id: number, _firstName: string, _lastName: string, _persona: string | null, _auth0Id: string): Promise<p.Employee> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const result = await prisma.employee.create({
            data: {
                id: _id,
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped,
                auth0Id: _auth0Id,
            }
        });

        return result;
    }

    /** Updates the employee's profile photo URI (Supabase storage path). */
    public static async updateProfilePhotoURI(id: number, uri: string): Promise<p.Employee> {
        return prisma.employee.update({
            where: { id },
            data: { profilePhotoURI: uri }
        });
    }

    /** Returns the employee's persisted widget layout JSON, or null if not yet set. */
    public static async getDashboardLayout(employeeId: number) {
        return prisma.employee.findUnique({
            where: { id: employeeId },
            select: { widgetLayout: true },
        });
    }

    /** Persists the employee's widget layout JSON. Overwrites any previously saved layout. */
    public static async updateDashboardLayout(employeeId: number, layout: unknown) {
        return prisma.employee.update({
            where: { id: employeeId },
            data: { widgetLayout: layout as any },
        });
    }

}