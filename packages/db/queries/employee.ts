import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper, employeeSelect} from "./helper";
import { generateEmbedding, embeddingToSql } from '../lib/embeddings';

export class Employee {
    public static async queryAllEmployees() {
        return prisma.employee.findMany({ select: employeeSelect })
    }

    /** Semantic vector search over all employees. Returns up to 20 results with `similarity` score (0–1). */
    public static async semanticSearch(query: string) {
        const embedding = await generateEmbedding(query);
        const embeddingStr = embeddingToSql(embedding);

        const rows = await prisma.$queryRaw<{ id: number; similarity: number }[]>`
            SELECT id, 1 - (embedding <=> ${embeddingStr}::vector) AS similarity
            FROM "Employee"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT 20
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

    public static async queryEmployeeById(id: number) {
        return prisma.employee.findUnique({
            where: { id },
            select: employeeSelect,
        })
    }

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

        setImmediate(async () => {
            try {
                const embedding = await generateEmbedding(`${_firstName} ${_lastName} ${_personaTyped}`);
                await prisma.$executeRaw`
                    UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${id}
                `;
            } catch (err) {
                console.error(`[background] Failed to embed employee id=${id}:`, err);
            }
        });

        return result;
    }

    public static async deleteEmployee(id: number): Promise<void> {
        await prisma.employee.delete({
            where: {id: id},
        })
    }

    public static async queryEmployeeByAuth( auth0Id: string ) {
        return prisma.employee.findUnique({
            where: { auth0Id: auth0Id }
        })
    }

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

        setImmediate(async () => {
            try {
                const embedding = await generateEmbedding(`${_firstName} ${_lastName} ${_personaTyped}`);
                await prisma.$executeRaw`
                    UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${_id}
                `;
            } catch (err) {
                console.error(`[background] Failed to embed employee id=${_id}:`, err);
            }
        });

        return result;
    }

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

        setImmediate(async () => {
            try {
                const embedding = await generateEmbedding(`${_firstName} ${_lastName} ${_personaTyped}`);
                await prisma.$executeRaw`
                    UPDATE "Employee" SET embedding = ${embeddingToSql(embedding)}::vector WHERE id = ${_id}
                `;
            } catch (err) {
                console.error(`[background] Failed to embed employee id=${_id}:`, err);
            }
        });

        return result;
    }

    public static async updateProfilePhotoURI(id: number, uri: string): Promise<p.Employee> {
        return prisma.employee.update({
            where: { id },
            data: { profilePhotoURI: uri }
        });
    }

    public static async getDashboardLayout(employeeId: number) {
        return prisma.employee.findUnique({
            where: { id: employeeId },
            select: { widgetLayout: true },
        });
    }

    public static async updateDashboardLayout(employeeId: number, layout: unknown) {
        return prisma.employee.update({
            where: { id: employeeId },
            data: { widgetLayout: layout as any },
        });
    }

}