// Wegwerf-Test für computeChain (wird nach dem Lauf gelöscht).
// Prüft die neue Regel: Der Übertrag überspringt Lücken.
import { Section } from "@prisma/client";
import { computeChain } from "./src/lib/month";

type E = { section: Section; amount: number };
const income = (n: number): E => ({ section: Section.INCOME, amount: n });
const expense = (n: number): E => ({ section: Section.EXPENSE, amount: n });

let failed = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  const ok = a === b;
  if (!ok) failed++;
  console.log(`  ${ok ? "OK    " : "FEHLER"} ${name}` + (ok ? "" : ` -> ${a} statt ${b}`));
}

// Fall 1: lückenlos – wie bisher.
{
  const chain = computeChain([
    { year: 2026, month: 1, entries: [income(100), expense(40)] }, // Rest 60
    { year: 2026, month: 2, entries: [income(50)] },
  ]);
  const feb = chain.get("2026-2")!;
  check("lückenlos: Februar erbt Januar-Rest", feb.carry, 60);
  check("lückenlos: Quelle = Januar", feb.carryFrom, { year: 2026, month: 1 });
  check("lückenlos: income inkl. Übertrag", feb.income, 110);
}

// Fall 2: Lücke – Februar fehlt, März muss trotzdem den Januar-Rest erben.
{
  const chain = computeChain([
    { year: 2026, month: 1, entries: [income(100), expense(40)] }, // Rest 60
    { year: 2026, month: 3, entries: [income(50)] },
  ]);
  const mar = chain.get("2026-3")!;
  check("Lücke: März erbt Januar-Rest", mar.carry, 60);
  check("Lücke: hasPrev trotz Lücke", mar.hasPrev, true);
  check("Lücke: Quelle = Januar (fürs Label)", mar.carryFrom, { year: 2026, month: 1 });
  check("Lücke: restbetrag stimmt", mar.restbetrag, 110);
}

// Fall 3: Lücke über den Jahreswechsel.
{
  const chain = computeChain([
    { year: 2025, month: 11, entries: [income(200), expense(50)] }, // Rest 150
    { year: 2026, month: 2, entries: [income(10)] },
  ]);
  const feb = chain.get("2026-2")!;
  check("Jahreswechsel-Lücke: Übertrag kommt an", feb.carry, 150);
  check("Jahreswechsel-Lücke: Quelle = Nov 2025", feb.carryFrom, { year: 2025, month: 11 });
}

// Fall 4: Schalter aus – kein Übertrag, auch nicht über Lücken.
{
  const chain = computeChain(
    [
      { year: 2026, month: 1, entries: [income(100)] },
      { year: 2026, month: 3, entries: [income(50)] },
    ],
    false,
  );
  const mar = chain.get("2026-3")!;
  check("carryOver aus: kein Übertrag", mar.carry, 0);
  check("carryOver aus: hasPrev false", mar.hasPrev, false);
  check("carryOver aus: carryFrom null", mar.carryFrom, null);
}

// Fall 5: erster Monat der Kette – nichts zu erben.
{
  const chain = computeChain([{ year: 2026, month: 5, entries: [income(80)] }]);
  const mai = chain.get("2026-5")!;
  check("erster Monat: kein Übertrag", mai.carry, 0);
  check("erster Monat: carryFrom null", mai.carryFrom, null);
}

console.log(failed === 0 ? "\nAlle Fälle bestanden." : `\n${failed} FEHLER`);
process.exit(failed === 0 ? 0 : 1);
