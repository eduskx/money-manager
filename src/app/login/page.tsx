"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/lib/actions";
import {
  fieldClass,
  labelClass,
  primaryButton,
  tile,
} from "@/components/styles";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className={`${tile} w-full max-w-sm sm:p-8`}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-on-accent"
          >
            €
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              Willkommen zurück
            </h1>
            <p className="text-sm text-muted">
              Melde dich an, um deine Finanzen zu sehen.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={fieldClass}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={`${primaryButton} w-full`}
          >
            {isPending ? "Anmelden …" : "Anmelden"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}
