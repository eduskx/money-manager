"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/lib/actions";
import {
  fieldClass,
  labelClass,
  primaryButton,
  tile,
} from "@/components/styles";

export default function RegisterPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    register,
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
            <h1 className="text-2xl font-semibold text-ink">Konto erstellen</h1>
            <p className="text-sm text-muted">
              Leg los und behalte deine Finanzen im Blick.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className={fieldClass}
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-faint">Mindestens 8 Zeichen.</p>
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
            {isPending ? "Konto wird erstellt …" : "Konto erstellen"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Schon registriert?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}
