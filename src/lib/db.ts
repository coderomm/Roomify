import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient();
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: undefined | PrismaClientSingleton
}

const prisma: PrismaClientSingleton = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;