import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.NEXT_PUBLIC_DATABASE_URL}`;
const readOnlyConnectionString = `${process.env.DATABASE_URL_READONLY}`;

const adapter = new PrismaPg({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
});
const prisma = new PrismaClient({ adapter });

const readOnlyAdapter = new PrismaPg({
    connectionString: readOnlyConnectionString,
    max: 3,
    idleTimeoutMillis: 30000,
});
const prismaReadOnly = new PrismaClient({ adapter: readOnlyAdapter });

export { prisma, prismaReadOnly };
