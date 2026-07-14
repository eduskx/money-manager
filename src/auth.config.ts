import type { NextAuthConfig } from "next-auth";

// Leichtgewichtige Konfiguration OHNE Datenbank/bcrypt.
// Sie wird auch in der Middleware (Edge-Runtime) verwendet, deshalb darf hier
// nichts Node-spezifisches importiert werden. Der Credentials-Provider mit
// bcrypt/Prisma kommt separat in `auth.ts` dazu.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Entscheidet, ob ein Request auf eine Seite zugreifen darf.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        // Nur eingeloggte Nutzer dürfen aufs Dashboard.
        return isLoggedIn;
      }
      return true;
    },
    // Die User-ID in den JWT-Token schreiben ...
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // ... und von dort in die Session, damit wir sie in Server-Komponenten haben.
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
