@AGENTS.md

# Money Manager — Projektkontext

Persönliche Finanz-Tracking-App. Herzensprojekt des Nutzers, der damit auch
**TypeScript lernen** möchte (kommt von React/Next.js). Antworten & Kommentare
auf **Deutsch**. Erklärend, nicht nur abliefern — der Nutzer will verstehen.

## Stack

- Next.js 16 (App Router, `proxy.ts` statt `middleware.ts`), TypeScript
- Prisma 6 + PostgreSQL (Neon). **Bewusst Prisma 6**, nicht 7 (7 verlangt
  Driver-Adapter-Config, für den Einstieg zu komplex).
- Auth.js v5 (NextAuth), Credentials-Provider (E-Mail/Passwort), JWT-Sessions.
- Tailwind CSS v4.

## Wichtige Umgebungs-Einschränkung (Claude Code on the web)

Die Web-Session-Umgebung blockt ausgehenden Zugriff auf `neon.tech`
(Egress-Policy, Port 5432 **und** HTTPS → 403). Daher aus der Web-Session
heraus **keine** `prisma migrate`/`db push` und **kein** Live-Test gegen die DB
möglich. Verifikation hier nur via `npm run build` (Compile + Typecheck) und
`npm run lint`. DB-Arbeit läuft lokal beim Nutzer oder erfordert eine
Netzwerk-Policy, die `neon.tech` erlaubt.

## Konventionen

- Secrets nur in `.env` (gitignored). Schema-Änderungen immer als Prisma-
  Migration (`prisma/migrations/`), nicht per db push.
- Beträge: `Decimal(12,2)` in der DB; im Server-Component mit `Number()` wandeln.
- Neue geschützte Bereiche unter `/dashboard/...` sind durch `src/proxy.ts`
  (authorized-Callback in `auth.config.ts`) automatisch geschützt.

## Nächste geplante Schritte (Roadmap)

Grundgerüst steht (Auth + Buchungen anlegen/löschen/auflisten). Als Nächstes
möglich: Kategorien, Bearbeiten von Buchungen, Monatsfilter, Diagramme,
Budgets, OAuth-Login (Google/GitHub).
