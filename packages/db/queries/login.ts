import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"

export class Login {
    public static async queryLoginByUsername(userName: string) {
        return prisma.login.findFirst({
            where: {userName}
        })
    }

    public static async createLogin(userName: string, password: string, employeeID: number) {
        const hashed = await bcrypt.hash(password, 10);
        return prisma.login.create({
            data: {userName, passwordHash: hashed, employeeID}
        })
    }

    public static async deleteLogin(id: number): Promise<void> {
        const deletedUser = await prisma.login.delete({
            where: {employeeID: id},
        })
    }

}