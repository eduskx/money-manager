// Logik der Tagesgeld-Seite (Phase 2): Standardblöcke sicherstellen, Einträge
// laden und die Salden berechnen.
//
// Regeln (vom Nutzer bestätigt):
//   - Saldo ist kumulativ/konto-gesamt über ALLE Jahre.
//   - Der Einnahmen-Block wird pro Jahr betrachtet (Jahres-Umschalter), zählt
//     aber mit allen Jahren in den Saldo.
//   - Saldo               = Σ Einnahmen − Σ Ausgaben
//   - Saldo exkl. zurückg = Saldo − Σ Zurückgelegt
//   - CUSTOM-Blöcke (ETF, Aktien, Krypto) zählen NICHT in den Saldo.

import { TagesgeldKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Die drei Standardblöcke (einer je User) in Anzeigereihenfolge.
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

async function loadBlocks(userId: string): Promise<TagesgeldBlockView[]> {
  const rows = await prisma.tagesgeldBlock.findMany({
    where: { userId },
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
 * Liefert alle Tagesgeld-Blöcke des Users. Fehlende Standardblöcke werden beim
 * ersten Aufruf angelegt.
 */
export async function getOrCreateTagesgeldBlocks(
  userId: string,
): Promise<TagesgeldBlockView[]> {
  let blocks = await loadBlocks(userId);

  const missing = STANDARD_BLOCKS.filter(
    (s) => !blocks.some((b) => b.kind === s.kind),
  );
  if (missing.length > 0) {
    await prisma.tagesgeldBlock.createMany({
      data: missing.map((s) => ({
        userId,
        kind: s.kind,
        name: s.name,
        position: s.position,
      })),
    });
    blocks = await loadBlocks(userId);
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
