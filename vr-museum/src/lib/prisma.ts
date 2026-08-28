import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// pg currently treats these modes as verify-full but warns because their
// meaning will change in its next major version. Make the intended strict
// certificate verification explicit and keep development consoles clean.
const verifiedDatabaseUrl = databaseUrl.replace(
  /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i,
  "$1sslmode=verify-full",
);
const adapter = new PrismaPg({ connectionString: verifiedDatabaseUrl });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
