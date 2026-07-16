"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  deleteAccount,
  logout,
  updateEmail,
  updatePassword,
  updateProfileName,
  type ProfileFormState,
} from "@/lib/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  fieldClass,
  labelClass,
  primaryButton,
  secondaryButton,
  tile,
} from "@/components/styles";

// Grün für Erfolg, Rot für Fehler – das sind Aussagen, keine Akzentfarben, und
// bleiben deshalb in jeder Farbwelt gleich.
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
    <section className={tile}>
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfileSettings({
  name,
  email,
  isGuest = false,
  guestExpiresAt = null,
}: {
  name: string;
  email: string;
  isGuest?: boolean;
  guestExpiresAt?: string | null; // schon formatiert – der Server kennt die Zeitzone
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
          <button type="submit" className={secondaryButton}>
            Abmelden
          </button>
        </form>
      </div>

      {/* Gast-Hinweis: sagt, was gilt, und bietet den Ausweg an. Steht ganz
          oben, weil es die wichtigste Information auf dieser Seite ist. */}
      {isGuest && (
        <section className={tile}>
          <h2 className="text-lg font-medium text-ink">Du bist als Gast hier</h2>
          <p className="mt-1 text-sm text-muted">
            Alles, was du siehst, sind Beispieldaten – ändere sie ruhig, du
            kannst nichts kaputt machen.
            {guestExpiresAt
              ? ` Dieses Gast-Konto wird am ${guestExpiresAt} automatisch gelöscht.`
              : ""}{" "}
            Wenn du deine Zahlen behalten möchtest, brauchst du ein eigenes
            Konto.
          </p>
          <div className="mt-4">
            <Link href="/register" className={primaryButton}>
              Eigenes Konto erstellen
            </Link>
          </div>
        </section>
      )}

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
              className={fieldClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={namePending} className={primaryButton}>
              {namePending ? "Speichern …" : "Speichern"}
            </button>
            <Feedback state={nameState} />
          </div>
        </form>
      </Card>

      {/* E-Mail, Passwort und Konto löschen ergeben für einen Gast keinen
          Sinn: Seine Zugangsdaten sind Zufallswerte, die er nie zu sehen
          bekommt. Ausgeblendet ist hier nur die halbe Miete – die Actions
          selbst lehnen Gäste ebenfalls ab (siehe rejectGuest). */}
      {!isGuest && (
        <>
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
              className={fieldClass}
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
              className={fieldClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={emailPending} className={primaryButton}>
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
              className={fieldClass}
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
              className={fieldClass}
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
              className={fieldClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwPending} className={primaryButton}>
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
              className={fieldClass}
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
        </>
      )}
    </div>
  );
}
