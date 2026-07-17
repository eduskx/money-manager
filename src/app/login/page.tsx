"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { authenticate, loginAsGuest } from "@/lib/actions";
import {
  fieldClass,
  labelClass,
  primaryButton,
  secondaryButton,
  tile,
} from "@/components/styles";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
  // Eigener Zustand: Ein Fehler beim Gast-Zugang hat nichts mit einem
  // falschen Passwort zu tun und soll die Anmeldung nicht kommentieren.
  //
  // Kein useActionState wie oben, weil es hier kein Formular gibt – der Knopf
  // schickt nichts mit. Deshalb Transition + eigener Fehler-State.
  const [guestError, setGuestError] = useState<string>();
  const [guestPending, startGuest] = useTransition();

  function startGuestLogin() {
    setGuestError(undefined);
    startGuest(async () => {
      // Klappt es, endet der Aufruf im Redirect aufs Dashboard und die Zeile
      // danach wird nie erreicht.
      const error = await loginAsGuest();
      if (error) setGuestError(error);
    });
  }

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
            <h1 className="text-2xl font-semibold text-ink">Monatsblick</h1>
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

        {/* Gast-Zugang: bewusst als Zweitweg abgesetzt, nicht als
            gleichwertige Alternative zum Anmelden. */}
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium uppercase tracking-wider text-faint">
            oder
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={startGuestLogin}
          disabled={guestPending}
          className={`${secondaryButton} mt-4 w-full`}
        >
          {guestPending ? "Wird vorbereitet …" : "Als Gast anmelden"}
        </button>
        <p className="mt-2 text-center text-xs text-faint">
          Ausprobieren ohne E-Mail. Du startest mit Beispieldaten, die du frei
          verändern kannst.
        </p>
        {guestError && (
          <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">
            {guestError}
          </p>
        )}

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
