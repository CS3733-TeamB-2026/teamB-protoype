import * as p from "../generated/prisma/client";
import {prisma} from "../lib/prisma";
import {Helper} from "./helper";

export class Employee {
    public static async queryAllEmployees(): Promise<p.Employee[]> {
        return prisma.employee.findMany({})
    }

    public static async queryEmployeeById(id: number): Promise<p.Employee | null> {
        return prisma.employee.findUnique({
            where: {id: id}
        })
    }

    public static async queryEmployeesByName(_firstName: string | null, _lastName: string | null): Promise<p.Employee[] | null> {
        if (_firstName === null && _lastName === null) {
            throw new Error("No name provided");
        }
        else if (_lastName === null) {
            return prisma.employee.findMany({
                where: {firstName: _firstName}
            })
        }
        else if (_firstName === null) {
            return prisma.employee.findMany({
                where: {lastName: _lastName}
            })
        }
        return prisma.employee.findMany({
            where: {
                firstName: _firstName,
                lastName: _lastName
            }
        })
    }

    public static async updateEmployee(id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<void> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        const updatedUser = await prisma.employee.update({
            where: {id: id},
            data: {
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            },
        })
    }

    public static async deleteEmployee(id: number): Promise<void> {
        const deletedUser = await prisma.employee.delete({
            where: {id: id},
        })
    }

    public static async createEmployee(_id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<void> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        await prisma.employee.create({
            data: {
                id: _id,
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            }
        })
    }

    public static async queryAllEmployeesWithLogin() {
        return prisma.employee.findMany({
            orderBy: { id: 'asc' },
            include: {
                login: {
                    select: {
                        userName: true
                    }
                }
            }
        })
    }

}