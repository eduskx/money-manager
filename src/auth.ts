import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// Die vollständige Auth-Konfiguration: baut auf authConfig auf und ergänzt
// den Credentials-Provider (E-Mail + Passwort). Dieser läuft nur in der
// Node-Runtime (API-Route), nicht in der Middleware.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // Eingaben validieren.
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Nutzer suchen und Passwort mit dem gespeicherten Hash vergleichen.
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
