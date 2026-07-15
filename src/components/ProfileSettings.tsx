"use client";

import { useActionState } from "react";
import {
  deleteAccount,
  logout,
  updateEmail,
  updatePassword,
  updateProfileName,
  type ProfileFormState,
} from "@/lib/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300";
const primaryBtn =
  "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-60";

function Feedback({ state }: { state: ProfileFormState }) {
  if (state.error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
    );
  }
  if (state.ok) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        {state.ok}
      </p>
    );
  }
  return null;
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfileSettings({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [nameState, nameAction, namePending] = useActionState(
    updateProfileName,
    {} as ProfileFormState,
  );
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmail,
    {} as ProfileFormState,
  );
  const [pwState, pwAction, pwPending] = useActionState(
    updatePassword,
    {} as ProfileFormState,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteAccount,
    {} as ProfileFormState,
  );

  return (
    <div className="space-y-4">
      {/* Abmelden – ganz oben, rechtsbündig */}
      <div className="flex justify-end">
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Abmelden
          </button>
        </form>
      </div>

      {/* Anzeigename */}
      <Card title="Anzeigename">
        <form action={nameAction} className="space-y-3">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={name}
              autoComplete="name"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={namePending} className={primaryBtn}>
              {namePending ? "Speichern …" : "Speichern"}
            </button>
            <Feedback state={nameState} />
          </div>
        </form>
      </Card>

      {/* E-Mail */}
      <Card
        title="E-Mail-Adresse"
        description="Die Änderung wird sofort wirksam (ohne Bestätigungs-Mail). Zur Sicherheit ist dein Passwort nötig."
      >
        <form action={emailAction} className="space-y-3">
          <div>
            <label htmlFor="email" className={labelClass}>
              Neue E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={email}
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email-password" className={labelClass}>
              Aktuelles Passwort
            </label>
            <input
              id="email-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={emailPending} className={primaryBtn}>
              {emailPending ? "Ändern …" : "E-Mail ändern"}
            </button>
            <Feedback state={emailState} />
          </div>
        </form>
      </Card>

      {/* Passwort */}
      <Card title="Passwort ändern">
        <form action={pwAction} className="space-y-3">
          <div>
            <label htmlFor="current" className={labelClass}>
              Aktuelles Passwort
            </label>
            <input
              id="current"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="next" className={labelClass}>
              Neues Passwort
            </label>
            <input
              id="next"
              name="next"
              type="password"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm" className={labelClass}>
              Neues Passwort bestätigen
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwPending} className={primaryBtn}>
              {pwPending ? "Ändern …" : "Passwort ändern"}
            </button>
            <Feedback state={pwState} />
          </div>
        </form>
      </Card>

      {/* Konto löschen (Danger Zone) */}
      <section className="rounded-2xl border border-red-300 bg-red-50/50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/20">
        <h2 className="text-lg font-medium text-red-700 dark:text-red-400">
          Konto löschen
        </h2>
        <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80">
          Löscht dein Konto samt allen Monaten, Einträgen und Tagesgeld-Daten
          unwiderruflich. Zur Bestätigung ist dein Passwort nötig.
        </p>
        <form action={delAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="delete-password" className={labelClass}>
              Passwort
            </label>
            <input
              id="delete-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <ConfirmSubmit
              message="Konto wirklich unwiderruflich löschen? Alle deine Daten gehen verloren."
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60"
            >
              {delPending ? "Löschen …" : "Konto löschen"}
            </ConfirmSubmit>
            <Feedback state={delState} />
          </div>
        </form>
      </section>
    </div>
  );
}
