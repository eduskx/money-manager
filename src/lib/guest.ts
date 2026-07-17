import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { Prisma, Section, TagesgeldKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { previousMonth } from "@/lib/month";

// Der Gast-Modus: ein Klick, keine Registrierung, sofort eine gefüllte App.
//
// Gedacht für Leute, denen Edu die App zeigt (z. B. Recruiter) und die dafür
// keine E-Mail-Adresse hergeben wollen. Ein Gast ist ein ganz normaler Nutzer
// in der DB – nur mit `isGuest = true`, Zufalls-Zugangsdaten und einem
// Verfallsdatum. Dadurch braucht KEINE andere Stelle der App Sonderlogik: Der
// Gast läuft durch dieselben Server-Actions, dieselbe Besitzprüfung und
// dieselbe Monatslogik wie jeder echte Nutzer.

/** Nach so vielen Tagen wird ein Gast-Konto samt Daten gelöscht. */
export const GUEST_TTL_DAYS = 7;

export type GuestCredentials = { email: string; password: string };

// --------------------------------------------------------------------------
// „Dasselbe Gerät = derselbe Gast"
// --------------------------------------------------------------------------
// Das Session-Cookie allein reicht dafür nicht: Meldet sich jemand ab oder
// läuft die Session aus, wäre der nächste Klick auf „Als Gast anmelden" ein
// neues, leeres Konto – die eingetippten Zahlen wären weg, obwohl das Konto
// noch existiert.
//
// Deshalb ein zweites Cookie, das die Zugangsdaten des Gasts behält. Es
// überlebt das Abmelden und führt beim nächsten Klick zurück ins selbe Konto,
// bis dieses nach GUEST_TTL_DAYS gelöscht wird.
//
// Zu den Zugangsdaten im Cookie: Es sind Zufallswerte eines Wegwerf-Kontos,
// die es ohne dieses Cookie nirgends gäbe. Das Cookie ist `httpOnly` (kein
// Zugriff per JavaScript, damit auch nicht über XSS auslesbar), `sameSite`
// und in Produktion `secure`. Wer es hat, ist der Gast – dieselbe Aussage
// trifft auf das Session-Cookie daneben ohnehin schon zu.
const GUEST_COOKIE = "guest_credentials";

async function readGuestCookie(): Promise<GuestCredentials | null> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as GuestCredentials).email === "string" &&
      typeof (parsed as GuestCredentials).password === "string"
    ) {
      return parsed as GuestCredentials;
    }
  } catch {
    // Kaputtes Cookie (von Hand verbogen, altes Format) – wie „kein Cookie".
  }
  return null;
}

async function rememberGuest(credentials: GuestCredentials): Promise<void> {
  (await cookies()).set(GUEST_COOKIE, JSON.stringify(credentials), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Genauso lang wie das Konto lebt – ein Cookie, das auf ein gelöschtes
    // Konto zeigt, hilft niemandem.
    maxAge: GUEST_TTL_DAYS * 24 * 60 * 60,
  });
}

async function forgetGuest(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
}

/**
 * Findet das Gast-Konto dieses Geräts wieder – falls es eines gibt und es
 * noch existiert.
 *
 * Die Prüfung gegen die DB ist der Punkt: Das Cookie kann auf ein Konto
 * zeigen, das der TTL-Aufräumer inzwischen gelöscht hat. Dann ist es wertlos
 * und fliegt raus, damit ein frisches Konto entstehen kann.
 */
export async function reuseGuest(): Promise<GuestCredentials | null> {
  const credentials = await readGuestCookie();
  if (!credentials) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: { isGuest: true },
  });

  if (!user?.isGuest) {
    await forgetGuest();
    return null;
  }
  return credentials;
}

/**
 * Löscht abgelaufene Gäste. Wird beim Anlegen eines neuen Gasts aufgerufen –
 * kein Cron-Job nötig: Wer aufräumt, zahlt dafür, und aufgeräumt wird nur,
 * wenn überhaupt jemand kommt.
 *
 * Monate, Einträge, Spalten und Sparkonten hängen per `onDelete: Cascade` am
 * Nutzer und verschwinden mit.
 */
export async function deleteExpiredGuests(): Promise<number> {
  const cutoff = new Date(Date.now() - GUEST_TTL_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { isGuest: true, createdAt: { lt: cutoff } },
  });
  return count;
}

// --------------------------------------------------------------------------
// Beispieldaten
// --------------------------------------------------------------------------
// Warum überhaupt? Ein leeres Dashboard zeigt nichts. Wer sich als Gast
// anmeldet und ein blankes Raster sieht, müsste erst selbst Gehalt und
// Fixkosten eintippen, um zu verstehen, was die App kann – das macht in den
// paar Minuten niemand. Die Beispieldaten sind deshalb nicht Beiwerk, sondern
// der Kern des Gast-Modus.
//
// Sie sind bewusst so gewählt, dass jedes Feature sichtbar wird: mehrere
// Ausgaben-Spalten, ein echter Vormonats-Übertrag, eine gespeicherte Formel,
// ein Sparkonto mit Jahres-Blöcken und ein saldoneutraler CUSTOM-Block.

type SeedEntry = { label: string; amount: number; formula?: string };
type SeedColumn = { name: string; entries: SeedEntry[] };
type SeedMonth = {
  year: number | null; // null => Vorlage
  month: number | null;
  isTemplate: boolean;
  customized: boolean;
  income: SeedEntry[];
  columns: SeedColumn[];
  ruecklagen: SeedEntry[];
};

// Die Fixkosten sind in Vorlage und Vormonat gleich – deshalb einmal hier.
const FIXKOSTEN: SeedEntry[] = [
  { label: "Miete", amount: 890 },
  { label: "Strom", amount: 62 },
  { label: "Internet", amount: 39.99 },
  { label: "Handyvertrag", amount: 12.99 },
  { label: "Deutschlandticket", amount: 58 },
  { label: "Fitnessstudio", amount: 29.9 },
  { label: "Netflix", amount: 13.99 },
  { label: "Spotify", amount: 10.99 },
];

function demoMonths(): SeedMonth[] {
  const now = new Date();
  const prev = previousMonth(now.getFullYear(), now.getMonth() + 1);

  // Vorlage und aktueller Monat teilen sich denselben Inhalt – Pflicht, kein
  // Zufall: Ein Monat mit customized = false MUSS die Vorlage spiegeln, sonst
  // würde ihn der nächste Vorlagen-Sync überschreiben und die Demo-Zahlen
  // sprängen unter den Augen des Betrachters um.
  const templateContent = {
    income: [{ label: "Gehalt", amount: 2450 }],
    columns: [
      { name: "Fixkosten", entries: FIXKOSTEN },
      {
        name: "Einkäufe / Essen / Leben",
        entries: [
          { label: "Woche 1", amount: 95 },
          { label: "Woche 2", amount: 95 },
          { label: "Woche 3", amount: 95 },
          { label: "Woche 4", amount: 95 },
        ],
      },
      { name: "Luxus", entries: [] },
    ],
    ruecklagen: [
      { label: "Tagesgeld", amount: 250 },
      { label: "ETF-Sparplan", amount: 150 },
    ],
  };

  return [
    // Die Vorlage.
    {
      year: null,
      month: null,
      isTemplate: true,
      customized: false,
      ...templateContent,
    },

    // Der aktuelle Monat – MUSS mitgeseedet werden, seit Monate nicht mehr
    // automatisch entstehen: Ohne ihn sähe ein Gast nach dem Login nur die
    // leere „Vorlage importieren"-Kachel, und ein leerer Gast zeigt nichts.
    {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      isTemplate: false,
      customized: false,
      ...templateContent,
    },

    // Der Vormonat – „schon bearbeitet" (customized), damit ihn der
    // Vorlagen-Sync in Ruhe lässt. Er existiert vor allem für EIN Feature:
    // Sein Restbetrag taucht im aktuellen Monat als „Vormonat" auf, ohne
    // irgendwo gespeichert zu sein (er wird gerechnet).
    {
      year: prev.year,
      month: prev.month,
      isTemplate: false,
      customized: true,
      income: [{ label: "Gehalt", amount: 2450 }],
      columns: [
        { name: "Fixkosten", entries: FIXKOSTEN },
        {
          name: "Einkäufe / Essen / Leben",
          entries: [
            { label: "Woche 1", amount: 102.4 },
            { label: "Woche 2", amount: 88.15 },
            { label: "Woche 3", amount: 96.8 },
            { label: "Woche 4", amount: 110.25 },
          ],
        },
        {
          name: "Luxus",
          entries: [
            { label: "Kino", amount: 24 },
            // Mit Formel: zeigt im Ruhezustand 68,50 – beim Reinklicken
            // erscheint „=42+26,50", wie in Excel.
            { label: "Restaurant", amount: 68.5, formula: "=42+26,50" },
            { label: "Kopfhörer", amount: 79.99 },
          ],
        },
      ],
      ruecklagen: [
        { label: "Tagesgeld", amount: 250 },
        { label: "ETF-Sparplan", amount: 150 },
      ],
    },
  ];
}

async function createMonth(
  tx: Prisma.TransactionClient,
  userId: string,
  seed: SeedMonth,
): Promise<void> {
  const month = await tx.month.create({
    data: {
      userId,
      year: seed.year,
      month: seed.month,
      isTemplate: seed.isTemplate,
      customized: seed.customized,
    },
  });

  // Einnahmen und Rücklagen hängen direkt am Monat (ohne Spalte) …
  await tx.entry.createMany({
    data: [
      ...seed.income.map((e, i) => ({
        monthId: month.id,
        section: Section.INCOME,
        label: e.label,
        amount: new Prisma.Decimal(e.amount),
        formula: e.formula ?? null,
        position: i,
      })),
      ...seed.ruecklagen.map((e, i) => ({
        monthId: month.id,
        section: Section.RUECKLAGE,
        label: e.label,
        amount: new Prisma.Decimal(e.amount),
        formula: e.formula ?? null,
        position: i,
      })),
    ],
  });

  // … Ausgaben brauchen zusätzlich ihre Spalte. Die muss es vorher geben,
  // deshalb Spalte anlegen und danach ihre Zeilen.
  for (const [i, column] of seed.columns.entries()) {
    const created = await tx.expenseColumn.create({
      data: { monthId: month.id, name: column.name, position: i },
    });
    if (column.entries.length === 0) continue;
    await tx.entry.createMany({
      data: column.entries.map((e, j) => ({
        monthId: month.id,
        columnId: created.id,
        section: Section.EXPENSE,
        label: e.label,
        amount: new Prisma.Decimal(e.amount),
        formula: e.formula ?? null,
        position: j,
      })),
    });
  }
}

async function createSavingsAccount(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const year = new Date().getFullYear();

  const account = await tx.savingsAccount.create({
    data: { userId, name: "Tagesgeld", position: 0 },
  });

  // Einnahmen und Ausgaben laufen pro Jahr (year gesetzt), Rücklagen und
  // eigene Blöcke gelten konto-gesamt (year bleibt null).
  const blocks: {
    kind: TagesgeldKind;
    name: string;
    year: number | null;
    entries: SeedEntry[];
  }[] = [
    {
      kind: TagesgeldKind.EINNAHMEN,
      name: "Einnahmen",
      year,
      entries: [
        { label: "Übertrag Vorjahr", amount: 4200 },
        { label: "Zinsen Q1", amount: 31.4 },
        { label: "Zinsen Q2", amount: 33.1 },
        { label: "Einzahlung", amount: 250 },
      ],
    },
    {
      kind: TagesgeldKind.AUSGABEN,
      name: "Ausgaben",
      year,
      entries: [
        { label: "Neuer Laptop", amount: 1249 },
        { label: "Zahnarzt", amount: 380 },
      ],
    },
    {
      kind: TagesgeldKind.ZURUECKGELEGT,
      name: "Rücklagen",
      year: null,
      entries: [
        { label: "Urlaub Portugal", amount: 900 },
        { label: "Geschenke", amount: 250 },
        { label: "Notgroschen", amount: 1500 },
      ],
    },
    {
      // CUSTOM zählt bewusst NICHT in den Saldo – zeigt genau diese Regel.
      kind: TagesgeldKind.CUSTOM,
      name: "ETF-Depot",
      year: null,
      entries: [
        { label: "MSCI World", amount: 3200 },
        { label: "Sparplan-Rate", amount: 150 },
      ],
    },
  ];

  for (const [i, block] of blocks.entries()) {
    const created = await tx.tagesgeldBlock.create({
      data: { accountId: account.id, kind: block.kind, name: block.name, position: i },
    });
    await tx.tagesgeldEntry.createMany({
      data: block.entries.map((e, j) => ({
        blockId: created.id,
        label: e.label,
        amount: new Prisma.Decimal(e.amount),
        formula: e.formula ?? null,
        year: block.year,
        position: j,
      })),
    });
  }
}

/**
 * Legt ein Gast-Konto samt Beispieldaten an und gibt die Zugangsdaten zurück,
 * damit der Aufrufer den Gast direkt anmelden kann.
 *
 * Die Zugangsdaten sind reine Zufallswerte: Sie existieren nur, weil der
 * Credentials-Provider von Auth.js E-Mail und Passwort verlangt. Niemand
 * bekommt sie zu sehen, und der Gast kann sich damit nicht erneut anmelden.
 * Das Passwort wird trotzdem gehasht gespeichert – nirgends im Klartext.
 *
 * Alles läuft in EINER Transaktion: Ein halb angelegter Gast (Konto ohne
 * Daten) wäre schlimmer als gar keiner.
 */
export async function createGuestUser(): Promise<GuestCredentials> {
  // `.invalid` ist per RFC 2606 dauerhaft für genau solche Fälle reserviert –
  // die Adresse kann also niemals einem echten Postfach gehören.
  const email = `gast-${randomUUID()}@gast.invalid`;
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: { name: "Gast", email, passwordHash, isGuest: true },
      });

      for (const seed of demoMonths()) {
        await createMonth(tx, user.id, seed);
      }
      await createSavingsAccount(tx, user.id);
    },
    // Großzügig: Das sind rund ein Dutzend Runden zur DB, und Neon liegt
    // nicht nebenan. Der Standard von 5 s wäre knapp.
    { timeout: 20_000 },
  );

  // Damit dasselbe Gerät beim nächsten Mal wieder hier landet.
  await rememberGuest({ email, password });

  return { email, password };
}
