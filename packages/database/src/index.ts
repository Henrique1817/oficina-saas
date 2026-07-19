import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reusa o client entre requests (Docker/Node long-running)
globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export { prisma as db };
