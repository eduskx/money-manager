// Logik der Sparkonten: Konten und ihre Blöcke sicherstellen, Einträge laden
// und die Salden berechnen.
//
// Aufbau: User -> SavingsAccount (z. B. „Tagesgeld") -> TagesgeldBlock ->
// TagesgeldEntry. Die Übersicht liegt unter /dashboard/sparkonten, ein
// einzelnes Konto unter /dashboard/sparkonten/[accountId].
//
// Regeln (vom Nutzer bestätigt):
//   - Saldo ist kumulativ/konto-gesamt über ALLE Jahre.
//   - Einnahmen und Ausgaben werden pro Jahr eingetragen (Jahres-Umschalter),
//     zählen aber mit allen Jahren in den Saldo.
//   - Saldo               = Σ Einnahmen − Σ Ausgaben
//   - Saldo exkl. Rückl.  = Saldo − Σ Rücklagen
//   - CUSTOM-Blöcke (ETF, Aktien, Krypto) zählen NICHT in den Saldo.

import { TagesgeldKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Höchstzahl an Sparkonten je User. */
export const MAX_SAVINGS_ACCOUNTS = 5;

// Die drei Standardblöcke (einer je Konto) in Anzeigereihenfolge.
export const STANDARD_BLOCKS: {
  kind: TagesgeldKind;
  name: string;
  position: number;
}[] = [
  { kind: TagesgeldKind.EINNAHMEN, name: "Einnahmen", position: 0 },
  { kind: TagesgeldKind.AUSGABEN, name: "Ausgaben", position: 1 },
  { kind: TagesgeldKind.ZURUECKGELEGT, name: "Rücklagen", position: 2 },
];

export type TagesgeldEntryView = {
  id: string;
  label: string;
  amount: number;
  formula: string | null;
  year: number | null;
};

export type TagesgeldBlockView = {
  id: string;
  kind: TagesgeldKind;
  name: string;
  position: number;
  entries: TagesgeldEntryView[];
};

export type SavingsAccountView = {
  id: string;
  name: string;
  position: number;
};

async function loadBlocks(accountId: string): Promise<TagesgeldBlockView[]> {
  const rows = await prisma.tagesgeldBlock.findMany({
    where: { accountId },
    include: {
      entries: {
        orderBy: [{ year: "desc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((b) => ({
    id: b.id,
    kind: b.kind,
    name: b.name,
    position: b.position,
    entries: b.entries.map((e) => ({
      id: e.id,
      label: e.label,
      amount: Number(e.amount),
      formula: e.formula,
      year: e.year,
    })),
  }));
}

/**
 * Alle Sparkonten des Users. Beim ersten Aufruf wird das Standardkonto
 * „Tagesgeld" angelegt, damit die Übersicht nie leer ist.
 */
export async function getOrCreateSavingsAccounts(
  userId: string,
): Promise<SavingsAccountView[]> {
  const load = () =>
    prisma.savingsAccount.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, position: true },
    });

  let accounts = await load();
  if (accounts.length === 0) {
    await prisma.savingsAccount.create({
      data: { userId, name: "Tagesgeld", position: 0 },
    });
    accounts = await load();
  }
  return accounts;
}

/** Ein Konto des Users – oder null, wenn es ihm nicht gehört/nicht existiert. */
export async function getSavingsAccount(
  userId: string,
  accountId: string,
): Promise<SavingsAccountView | null> {
  return prisma.savingsAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true, name: true, position: true },
  });
}

/**
 * Liefert alle Blöcke eines Kontos. Fehlende Standardblöcke werden beim ersten
 * Aufruf angelegt.
 */
export async function getOrCreateTagesgeldBlocks(
  accountId: string,
): Promise<TagesgeldBlockView[]> {
  let blocks = await loadBlocks(accountId);

  const missing = STANDARD_BLOCKS.filter(
    (s) => !blocks.some((b) => b.kind === s.kind),
  );
  if (missing.length > 0) {
    await prisma.tagesgeldBlock.createMany({
      data: missing.map((s) => ({
        accountId,
        kind: s.kind,
        name: s.name,
        position: s.position,
      })),
    });
    blocks = await loadBlocks(accountId);
  }

  return blocks;
}

export function sumEntries(entries: { amount: number }[]): number {
  return entries.reduce((total, e) => total + e.amount, 0);
}

function sumKind(blocks: TagesgeldBlockView[], kind: TagesgeldKind): number {
  return blocks
    .filter((b) => b.kind === kind)
    .reduce((total, b) => total + sumEntries(b.entries), 0);
}

export type TagesgeldTotals = {
  einnahmen: number; // alle Jahre
  ausgaben: number;
  zurueckgelegt: number;
  saldo: number; // einnahmen − ausgaben
  saldoExklZurueck: number; // saldo − zurueckgelegt
};

export function computeTagesgeldTotals(
  blocks: TagesgeldBlockView[],
): TagesgeldTotals {
  const einnahmen = sumKind(blocks, TagesgeldKind.EINNAHMEN);
  const ausgaben = sumKind(blocks, TagesgeldKind.AUSGABEN);
  const zurueckgelegt = sumKind(blocks, TagesgeldKind.ZURUECKGELEGT);
  const saldo = einnahmen - ausgaben;
  return {
    einnahmen,
    ausgaben,
    zurueckgelegt,
    saldo,
    saldoExklZurueck: saldo - zurueckgelegt,
  };
}

// ---------------------------------------------------------------------------
// Übersicht: alle Konten mit ihrem Saldo
// ---------------------------------------------------------------------------

export type SavingsAccountSummary = SavingsAccountView & { saldo: number };

/**
 * Für die Sparkonten-Übersicht: alle Konten des Users samt Saldo. Lädt die
 * Blöcke aller Konten in EINER Abfrage und summiert sie je Konto.
 */
export async function loadAccountSummaries(
  userId: string,
): Promise<SavingsAccountSummary[]> {
  const accounts = await getOrCreateSavingsAccounts(userId);

  const blocks = await prisma.tagesgeldBlock.findMany({
    where: { account: { userId } },
    select: {
      accountId: true,
      kind: true,
      entries: { select: { amount: true } },
    },
  });

  // Saldo = Σ Einnahmen − Σ Ausgaben (CUSTOM und Rücklagen zählen nicht rein).
  const sums = new Map<string, { einnahmen: number; ausgaben: number }>();
  for (const a of accounts) sums.set(a.id, { einnahmen: 0, ausgaben: 0 });

  for (const b of blocks) {
    const s = sums.get(b.accountId);
    if (!s) continue;
    const total = b.entries.reduce((t, e) => t + Number(e.amount), 0);
    if (b.kind === TagesgeldKind.EINNAHMEN) s.einnahmen += total;
    else if (b.kind === TagesgeldKind.AUSGABEN) s.ausgaben += total;
  }

  return accounts.map((a) => {
    const s = sums.get(a.id);
    return { ...a, saldo: s ? s.einnahmen - s.ausgaben : 0 };
  });
}
