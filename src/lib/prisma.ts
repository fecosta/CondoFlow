import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getCleanUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.searchParams.delete("pgbouncer");
    return u.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: getCleanUrl(process.env.DIRECT_URL ?? process.env.DATABASE_URL), max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
