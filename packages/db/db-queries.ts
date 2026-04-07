import { prisma } from "./lib/prisma"
import * as p from "./generated/prisma/client";
import { supabase } from './lib/supabase'
import bcrypt from "bcrypt"
const bucket = "content"

export async function queryLoginByUsername(userName: string) {
    return prisma.login.findFirst({
        where: {userName}
    })
}

export async function createLogin(userName: string, password: string, employeeID: number) {
    const hashed = await bcrypt.hash(password, 10);
    return prisma.login.create({
        data: {userName, passwordHash: hashed, employeeID}
    })
}