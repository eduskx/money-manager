"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/auth";

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
// Buchungen (Transaktionen)
// ---------------------------------------------------------------------------

const TransactionSchema = z.object({
  description: z.string().trim().min(1, "Bitte gib eine Beschreibung an."),
  amount: z.coerce.number().positive("Der Betrag muss größer als 0 sein."),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.coerce.date(),
});

export async function addTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = TransactionSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    // Für das schlanke Grundgerüst ignorieren wir ungültige Eingaben still.
    // Später ersetzen wir das durch schöne Fehlermeldungen im Formular.
    return;
  }

  await prisma.transaction.create({
    data: {
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      date: parsed.data.date,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const id = formData.get("id");
  if (typeof id !== "string") return;

  // deleteMany mit userId stellt sicher, dass niemand fremde Buchungen löscht.
  await prisma.transaction.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard");
}
