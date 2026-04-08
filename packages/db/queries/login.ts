import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"

export class Login {
    public static async queryLoginByUsername(userName: string):
        Promise<{userName: string,
            passwordHash: string,
            employeeID: number} | null> {
        return prisma.login.findFirst({
            where: {userName}
        })
    }

    public static async createLogin(userName: string, password: string, employeeID: number):
        Promise<{userName: string,
            passwordHash: string,
            employeeID: number} | null> {
        const hashed = await bcrypt.hash(password, 10);
        return prisma.login.create({
            data: {userName, passwordHash: hashed, employeeID}
        })
    }
}