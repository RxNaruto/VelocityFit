import { PrismaClient } from "@prisma/client";
/**
 * Singleton Prisma client.
 * Prevents multiple connections during hot reload.
 */
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["warn", "error"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
export default prisma;
//# sourceMappingURL=prisma.js.map