# 💰 Money Manager

Eine Web-App zum Tracken persönlicher Finanzen — Einnahmen und Ausgaben
erfassen, Saldo im Blick behalten. Mit eigenem Konto (Login), sodass die
Daten an deinen Account gebunden sind.

## Tech-Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 6** (ORM) + **PostgreSQL** (gehostet bei [Neon](https://neon.tech))
- **Auth.js v5** (NextAuth) — Login mit E-Mail & Passwort
- **Tailwind CSS**

## Lokales Setup

> Voraussetzung: Node.js 20+ und eine Neon-Postgres-Datenbank.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env
#   -> in .env die echte DATABASE_URL (aus Neon) und ein AUTH_SECRET eintragen.
#   AUTH_SECRET erzeugen mit:  npx auth secret

# 3. Datenbank-Schema anwenden (legt die Tabellen an)
npx prisma migrate deploy      # wendet die vorhandene Migration an
#   Beim Weiterentwickeln des Schemas stattdessen:  npx prisma migrate dev

# 4. Dev-Server starten
npm run dev
```

Danach im Browser <http://localhost:3000> öffnen, ein Konto registrieren und
loslegen.

## Nützliche Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungs-Server (Hot Reload) |
| `npm run build` | Produktions-Build + Typecheck |
| `npm run lint` | Linter |
| `npx prisma studio` | Datenbank im Browser ansehen/bearbeiten |
| `npx prisma migrate dev --name <x>` | Schema ändern + neue Migration |

## Projektstruktur (Kurzüberblick)

```
prisma/schema.prisma      Datenmodell (User, Transaction)
src/auth.config.ts        Leichte Auth-Config (auch für Route-Schutz/proxy.ts)
src/auth.ts               Volle Auth-Config (Login-Logik mit bcrypt)
src/proxy.ts              Schützt /dashboard vor nicht eingeloggten Nutzern
src/lib/prisma.ts         Prisma-Client (Singleton)
src/lib/actions.ts        Server-Actions: Registrieren, Login, Buchungen
src/app/login             Login-Seite
src/app/register          Registrierungs-Seite
src/app/dashboard         Dashboard: Übersicht, Formular, Buchungsliste
```
