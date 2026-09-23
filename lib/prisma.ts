import { PrismaClient } from "@prisma/client";

/**
 * A single PrismaClient is reused across hot reloads in development and across
 * warm lambda invocations in production.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  dbOnline?: boolean;
  lastDbCheck?: number;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

globalForPrisma.prisma = prisma;

/**
 * Quick, cached check to determine if the PostgreSQL database is reachable.
 * Prevents throwing noisy PrismaClientInitializationErrors when the remote
 * database project is paused or offline.
 */
export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();
  if (
    globalForPrisma.dbOnline !== undefined &&
    globalForPrisma.lastDbCheck &&
    now - globalForPrisma.lastDbCheck < 60_000
  ) {
    return globalForPrisma.dbOnline;
  }

  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB probe timeout")), 1200)
    );
    await Promise.race([probe, timeout]);
    globalForPrisma.dbOnline = true;
    globalForPrisma.lastDbCheck = now;
    return true;
  } catch {
    globalForPrisma.dbOnline = false;
    globalForPrisma.lastDbCheck = now;
    return false;
  }
}

export default prisma;
