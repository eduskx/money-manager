# 💰 Monatsblick

Eine Web-App, mit der ich meine persönlichen Finanzen so tracke, wie ich es
vorher in Excel gemacht habe. Man legt für jeden Monat seine Einnahmen und
Ausgaben an und sieht sofort, was am Ende übrig bleibt. Alles hängt an einem
eigenen Konto mit Login, die Daten sind also privat.

## Was die App kann

Pro Monat trägst du deine Einnahmen ein und legst so viele Ausgaben-Spalten an,
wie du brauchst (zum Beispiel Fixkosten, Einkäufe, Luxus). Der Saldo zeigt dir
laufend, was übrig bleibt. Was in einem Monat übrig ist, kann als Übertrag in
den nächsten Monat einfließen, damit sich die Monate realistisch aufeinander
aufbauen.

Damit du nicht jeden Monat bei null anfängst, gibt es eine Vorlage. Du richtest
sie einmal mit deinen üblichen Posten ein, und ein neuer Monat übernimmt sie
beim Anlegen.

Für Rücklagen gibt es Sparkonten. Jedes Konto hat eigene Blöcke für Einnahmen,
Ausgaben und zurückgelegte Beträge, dazu frei anlegbare Blöcke etwa für ETF,
Aktien oder Krypto. Einnahmen und Ausgaben laufen dort pro Jahr, der Saldo zählt
über alle Jahre zusammen.

Ein paar Dinge, die den Alltag angenehmer machen:

- In jedem Betragsfeld kannst du rechnen wie in Excel, zum Beispiel `=60+30`
  oder `100/4`. Die Formel bleibt gespeichert und erscheint wieder, sobald du
  ins Feld klickst.
- Sieben Farbwelten, jeweils mit Hell- und Dunkelmodus.
- Ein Gast-Modus, über den man die App ohne Registrierung mit Beispieldaten
  ausprobieren kann. Praktisch, um sie schnell jemandem zu zeigen.

## Tech-Stack

- **Next.js 16** mit App Router und **TypeScript**
- **Prisma 6** als ORM auf **PostgreSQL**, gehostet bei [Neon](https://neon.tech)
- **Auth.js v5** (NextAuth) für den Login per E-Mail und Passwort, mit
  JWT-Sessions und bcrypt für die Passwörter
- **Tailwind CSS v4** mit klassenbasiertem Dark-Mode

Die App ist bewusst serverlastig gebaut: Die Budget-Logik und die Besitzprüfung
der Daten liegen in Server-Actions, nicht im Browser.

## Lokales Setup

> Voraussetzung: Node.js 20 oder neuer und eine Postgres-Datenbank (bei Neon
> reicht der kostenlose Tarif).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env
#   In .env die DATABASE_URL (aus Neon) und ein AUTH_SECRET eintragen.
#   AUTH_SECRET erzeugen mit:  npx auth secret

# 3. Datenbank-Tabellen anlegen
npx prisma migrate deploy

# 4. Dev-Server starten
npm run dev
```

Danach <http://localhost:3000> im Browser öffnen. Du kannst dir ein Konto
anlegen oder direkt auf „Als Gast anmelden" klicken, um mit Beispieldaten zu
starten.

## Nützliche Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungs-Server mit Hot Reload |
| `npm run build` | Produktions-Build inklusive Typecheck |
| `npm run lint` | Linter |
| `npx prisma studio` | Datenbank im Browser ansehen und bearbeiten |
| `npx prisma migrate dev --name <name>` | Schema ändern und eine neue Migration erzeugen |

## Projektstruktur (Kurzüberblick)

```
prisma/schema.prisma     Datenmodell (User, Month, Entry, ExpenseColumn,
                         SavingsAccount, TagesgeldBlock, TagesgeldEntry)
src/auth.ts              Auth.js mit Credentials-Provider und bcrypt
src/auth.config.ts       Schlanke Auth-Config, auch für den Route-Schutz
src/proxy.ts             Schützt alles unter /dashboard vor Fremdzugriff
src/lib/month.ts         Budget-Logik: Monate, Vorlage, Vormonats-Übertrag
src/lib/tagesgeld.ts     Logik der Sparkonten
src/lib/calc.ts          Formel-Parser für die Betragsfelder (ohne eval)
src/lib/actions.ts       Server-Actions: Login, Einträge, Sparkonten, Profil
src/lib/guest.ts         Gast-Modus mit Beispieldaten
src/lib/palette.ts       Farbwelten
src/components/          UI-Komponenten (Budget-Board, Zeilen, Kopfzeile ...)
src/app/dashboard        Monatsansicht, Vorlage, Sparkonten, Profil
```

## Hinweis

Das hier ist ein persönliches Lernprojekt. Ich komme von React und Next.js und
nutze es, um TypeScript, Prisma und Server-Actions in Ruhe zu vertiefen.
