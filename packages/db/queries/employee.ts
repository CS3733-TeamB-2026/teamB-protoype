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

    public static async queryEmployeesByName(firstName: string | null, lastName: string | null): Promise<p.Employee[] | null> {
        let _firstName
        let _lastName
        if (firstName !== null && lastName !== null) {
            _firstName = firstName
            _lastName = lastName
            return prisma.employee.findMany({
                where: {
                    firstName: _firstName,
                    lastName: _lastName
                }
            })
        }
        else if(firstName !== null && lastName === null) {
            _firstName = firstName
            return prisma.employee.findMany({
                where: {
                    firstName: _firstName
                }
            })
        }
        else if(firstName === null && lastName !== null) {
            _lastName = lastName
            return prisma.employee.findMany({
                where: {
                    lastName: _lastName
                }
            })
        }
        else{
            throw new Error("No persona type provided")
        }
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