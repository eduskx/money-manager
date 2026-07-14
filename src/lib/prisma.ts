import { PrismaClient } from "@prisma/client";

// Im Dev-Modus lädt Next.js Code häufig neu. Ohne diesen Singleton würden
// dabei viele DB-Verbindungen geöffnet. Wir cachen den Client daher global.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
