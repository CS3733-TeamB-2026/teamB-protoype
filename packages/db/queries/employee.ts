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

    public static async updateEmployee(id: number, _firstName: string, _lastName: string, _persona: string | null): Promise<p.Employee> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        return prisma.employee.update({
            where: {id: id},
            data: {
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            },
        })
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
        return prisma.employee.create({
            data: {
                id: _id,
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped
            }
        })
    }

    public static async createEmployeeWithAuth0(_id: number, _firstName: string, _lastName: string, _persona: string | null, _auth0Id: string): Promise<p.Employee> {
        const _personaTyped: p.Persona | null = Helper.personaHelper(_persona)
        if (_personaTyped === null) {
            throw new Error("No persona type provided")
        }
        return prisma.employee.create({
            data: {
                id: _id,
                firstName: _firstName,
                lastName: _lastName,
                persona: _personaTyped,
                auth0Id: _auth0Id,
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

    public static async updateProfilePhotoURI(id: number, uri: string): Promise<p.Employee> {
        return prisma.employee.update({
            where: { id },
            data: { profilePhotoURI: uri }
        });
    }

}