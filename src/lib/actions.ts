"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma, Section } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/auth";
import { isFormulaInput, parseAmount } from "@/lib/calc";
import { applyTemplateToMonths, previousMonth } from "@/lib/month";

// ---------------------------------------------------------------------------
// Registrierung
// ---------------------------------------------------------------------------

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Bitte gib einen Namen an."),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse an."),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
});

export async function register(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "Diese E-Mail-Adresse ist bereits registriert.";
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  // Direkt einloggen und aufs Dashboard leiten.
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Auth.js signalisiert einen erfolgreichen Redirect ebenfalls über eine
    // Exception – die müssen wir weiterreichen. Nur echte Auth-Fehler abfangen.
    if (error instanceof AuthError) {
      return "E-Mail oder Passwort ist falsch.";
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// ---------------------------------------------------------------------------
// Einträge (Zeilen in einem Monats- oder Vorlage-Block)
// ---------------------------------------------------------------------------

// Eingeloggte User-ID holen oder zur Login-Seite umleiten.
async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

function isSection(value: string): value is Section {
  return (Object.values(Section) as string[]).includes(value);
}

// Nach einer Änderung: Monatsansicht UND Vorlage neu rendern. Der Eintrag kann
// zu beidem gehören; beide Pfade zu revalidieren ist günstig und robust.
function revalidateBudget() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vorlage");
}

// Wird nach jeder Eintrags-Änderung aufgerufen:
//  - War es die Vorlage? Dann die Vorlage auf passende Monate anwenden.
//  - War es ein echter Monat? Dann ihn als „bearbeitet" markieren, damit ihn
//    künftige Vorlagen-Änderungen nicht mehr überschreiben.
async function afterEntryChange(
  userId: string,
  monthId: string,
  isTemplate: boolean,
) {
  if (isTemplate) {
    await applyTemplateToMonths(userId);
  } else {
    await prisma.month.update({
      where: { id: monthId },
      data: { customized: true },
    });
  }
  revalidateBudget();
}

export async function addEntry(formData: FormData) {
  const userId = await requireUserId();

  const monthId = String(formData.get("monthId") ?? "");
  const sectionRaw = String(formData.get("section") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "");
  const amount = parseAmount(rawAmount);
  const formula = isFormulaInput(rawAmount) ? rawAmount.trim() : null;

  // Ohne Bezeichnung legen wir keine Zeile an; der Betrag darf 0/leer sein.
  if (!monthId || !isSection(sectionRaw) || !label) return;

  // Besitz prüfen: Gehört der Monat/​die Vorlage diesem User?
  const month = await prisma.month.findFirst({
    where: { id: monthId, userId },
    select: { id: true, isTemplate: true },
  });
  if (!month) return;

  // Neue Zeile ans Ende des Abschnitts hängen.
  const last = await prisma.entry.aggregate({
    where: { monthId, section: sectionRaw },
    _max: { position: true },
  });
  const position = (last._max.position ?? -1) + 1;

  await prisma.entry.create({
    data: {
      monthId,
      section: sectionRaw,
      label,
      amount: new Prisma.Decimal((amount ?? 0).toFixed(2)),
      formula,
      position,
    },
  });

  await afterEntryChange(userId, monthId, month.isTemplate);
}

export async function updateEntry(formData: FormData) {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "");
  const amount = parseAmount(rawAmount);
  const formula = isFormulaInput(rawAmount) ? rawAmount.trim() : null;
  if (!id) return;

  // Eintrag (user-scoped) samt zugehörigem Monat holen.
  const entry = await prisma.entry.findFirst({
    where: { id, month: { userId } },
    select: { id: true, monthId: true, month: { select: { isTemplate: true } } },
  });
  if (!entry) return;

  await prisma.entry.update({
    where: { id: entry.id },
    data: {
      ...(label ? { label } : {}), // leeres Label nicht überschreiben
      amount: new Prisma.Decimal((amount ?? 0).toFixed(2)),
      formula,
    },
  });

  await afterEntryChange(userId, entry.monthId, entry.month.isTemplate);
}

export async function deleteEntry(formData: FormData) {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const entry = await prisma.entry.findFirst({
    where: { id, month: { userId } },
    select: { id: true, monthId: true, month: { select: { isTemplate: true } } },
  });
  if (!entry) return;

  await prisma.entry.delete({ where: { id: entry.id } });

  await afterEntryChange(userId, entry.monthId, entry.month.isTemplate);
}

// ---------------------------------------------------------------------------
// Löschen / Zurücksetzen
// ---------------------------------------------------------------------------

// Alle Monate löschen (Vorlage bleibt) und danach auf den echten aktuellen
// Monat springen. Dieser wird beim Rendern automatisch neu aus der Vorlage
// angelegt.
export async function deleteAllMonths() {
  const userId = await requireUserId();

  await prisma.month.deleteMany({ where: { userId, isTemplate: false } });

  const now = new Date();
  revalidatePath("/dashboard");
  redirect(`/dashboard?y=${now.getFullYear()}&m=${now.getMonth() + 1}`);
}

// Den in der App gerade angezeigten Monat löschen und zum Vormonat springen.
// Der gelöschte Monat wird NICHT automatisch neu erzeugt – er entsteht erst
// wieder, wenn man ihn selbst ansteuert.
export async function deleteCurrentMonth(formData: FormData) {
  const userId = await requireUserId();

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return;
  }

  await prisma.month.deleteMany({
    where: { userId, isTemplate: false, year, month },
  });

  const prev = previousMonth(year, month);
  revalidatePath("/dashboard");
  redirect(`/dashboard?y=${prev.year}&m=${prev.month}`);
}

// Die Vorlage leeren. Da unberührte Monate die Vorlage spiegeln, werden diese
// dadurch ebenfalls geleert; bearbeitete Monate (customized = true) bleiben.
export async function clearTemplate() {
  const userId = await requireUserId();

  const template = await prisma.month.findFirst({
    where: { userId, isTemplate: true },
    select: { id: true },
  });
  if (template) {
    await prisma.entry.deleteMany({ where: { monthId: template.id } });
  }

  await applyTemplateToMonths(userId);
  revalidateBudget();
}

// ---------------------------------------------------------------------------
// Tagesgeld (Phase 2)
// ---------------------------------------------------------------------------

function revalidateTagesgeld() {
  revalidatePath("/dashboard/tagesgeld");
}

export async function addTagesgeldEntry(formData: FormData) {
  const userId = await requireUserId();

  const blockId = String(formData.get("blockId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "");
  const amount = parseAmount(rawAmount);
  const formula = isFormulaInput(rawAmount) ? rawAmount.trim() : null;
  const yearRaw = Number(formData.get("year"));
  if (!blockId || !label) return;

  // Besitz prüfen + Art bestimmen (nur EINNAHMEN bekommt ein Jahr).
  const block = await prisma.tagesgeldBlock.findFirst({
    where: { id: blockId, userId },
    select: { id: true, kind: true },
  });
  if (!block) return;

  const year =
    block.kind === "EINNAHMEN" && Number.isInteger(yearRaw) ? yearRaw : null;

  const last = await prisma.tagesgeldEntry.aggregate({
    where: { blockId, ...(year != null ? { year } : {}) },
    _max: { position: true },
  });
  const position = (last._max.position ?? -1) + 1;

  await prisma.tagesgeldEntry.create({
    data: {
      blockId,
      label,
      amount: new Prisma.Decimal((amount ?? 0).toFixed(2)),
      formula,
      year,
      position,
    },
  });

  revalidateTagesgeld();
}

export async function updateTagesgeldEntry(formData: FormData) {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "");
  const amount = parseAmount(rawAmount);
  const formula = isFormulaInput(rawAmount) ? rawAmount.trim() : null;
  if (!id) return;

  const entry = await prisma.tagesgeldEntry.findFirst({
    where: { id, block: { userId } },
    select: { id: true },
  });
  if (!entry) return;

  await prisma.tagesgeldEntry.update({
    where: { id: entry.id },
    data: {
      ...(label ? { label } : {}),
      amount: new Prisma.Decimal((amount ?? 0).toFixed(2)),
      formula,
    },
  });

  revalidateTagesgeld();
}

export async function deleteTagesgeldEntry(formData: FormData) {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.tagesgeldEntry.deleteMany({
    where: { id, block: { userId } },
  });

  revalidateTagesgeld();
}

// Einen eigenen Block anlegen (z. B. ETF, Aktien, Krypto). Saldoneutral.
export async function addCustomBlock(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const last = await prisma.tagesgeldBlock.aggregate({
    where: { userId },
    _max: { position: true },
  });

  await prisma.tagesgeldBlock.create({
    data: {
      userId,
      kind: "CUSTOM",
      name,
      position: (last._max.position ?? -1) + 1,
    },
  });

  revalidateTagesgeld();
}

// Nur eigene CUSTOM-Blöcke löschen (Standardblöcke bleiben geschützt).
export async function deleteCustomBlock(formData: FormData) {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.tagesgeldBlock.deleteMany({
    where: { id, userId, kind: "CUSTOM" },
  });

  revalidateTagesgeld();
}

// ---------------------------------------------------------------------------
// Profil (Anzeigename, E-Mail, Passwort, Konto löschen)
// ---------------------------------------------------------------------------

// Rückgabetyp für die Profil-Formulare (mit useActionState). Genau eins von
// beiden ist gesetzt: ok = Erfolgsmeldung, error = Fehlermeldung.
export type ProfileFormState = { ok?: string; error?: string };

const NameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bitte gib einen Namen an.")
    .max(80, "Der Name darf höchstens 80 Zeichen haben."),
});

export async function updateProfileName(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const parsed = NameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  });

  // Der Anzeigename wird im Dashboard-Header aus der DB gelesen.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  return { ok: "Anzeigename gespeichert." };
}

const EmailSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse an."),
  password: z.string().min(1, "Bitte bestätige die Änderung mit deinem Passwort."),
});

export async function updateEmail(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const parsed = EmailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  const passwordsMatch = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!passwordsMatch) return { error: "Das Passwort ist falsch." };

  if (parsed.data.email === user.email) {
    return { error: "Das ist bereits deine E-Mail-Adresse." };
  }

  const taken = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (taken) return { error: "Diese E-Mail-Adresse ist bereits vergeben." };

  await prisma.user.update({
    where: { id: userId },
    data: { email: parsed.data.email },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  return { ok: "E-Mail-Adresse geändert. Beim nächsten Login gilt die neue Adresse." };
}

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Bitte gib dein aktuelles Passwort ein."),
    next: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen haben."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Die neuen Passwörter stimmen nicht überein.",
    path: ["confirm"],
  });

export async function updatePassword(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const parsed = PasswordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) redirect("/login");

  const currentMatches = await bcrypt.compare(
    parsed.data.current,
    user.passwordHash,
  );
  if (!currentMatches) return { error: "Das aktuelle Passwort ist falsch." };

  const passwordHash = await bcrypt.hash(parsed.data.next, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { ok: "Passwort geändert." };
}

const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Bitte bestätige mit deinem Passwort."),
});

export async function deleteAccount(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const parsed = DeleteAccountSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) redirect("/login");

  const passwordsMatch = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!passwordsMatch) return { error: "Das Passwort ist falsch." };

  // Löscht den User; Monate, Einträge und Tagesgeld-Blöcke werden per
  // onDelete: Cascade automatisch mitgelöscht.
  await prisma.user.delete({ where: { id: userId } });

  await signOut({ redirectTo: "/login" });
  return {}; // nicht erreichbar – signOut leitet um
}
