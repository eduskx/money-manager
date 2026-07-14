import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Diese Datei (Next.js 16 "proxy"-Konvention, früher "middleware") läuft vor
// jedem Request und schützt via authorized-Callback z. B. das /dashboard.
// Nicht eingeloggte Nutzer werden auf /login umgeleitet.
export default NextAuth(authConfig).auth;

export const config = {
  // Alle Pfade außer statischen Dateien und der Auth-API prüfen.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
