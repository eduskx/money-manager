import type { DefaultSession } from "next-auth";

// Wir erweitern die Standard-Typen von Auth.js, damit `session.user.id`
// überall typsicher verfügbar ist (TypeScript-Modul-Augmentation).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
