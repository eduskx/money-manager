import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { loadAccountSummaries, MAX_SAVINGS_ACCOUNTS } from "@/lib/tagesgeld";
import {
  addSavingsAccount,
  deleteSavingsAccount,
  renameSavingsAccount,
} from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import { EditableName } from "@/components/EditableName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { HeaderTools } from "@/components/HeaderTools";
import {
  bigNumber,
  filledHeader,
  headerButton,
  headerIconButton,
  tileFlush,
  tileHeading,
} from "@/components/styles";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
} from "@/components/icons";

// Übersicht aller Sparkonten: je Konto Name (über den Stift bearbeitbar) und
// Saldo. Ein Klick auf den Saldo-Bereich öffnet das Konto.
export default async function SparkontenPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await loadAccountSummaries(session.user.id);
  const canAdd = accounts.length < MAX_SAVINGS_ACCOUNTS;
  const canDelete = accounts.length > 1;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Zurück zur Monatsansicht"
              className={headerIconButton}
            >
              <IconChevronLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Sparkonten</h1>
              <p className="text-sm text-muted">
                {accounts.length} von {MAX_SAVINGS_ACCOUNTS} Konten
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAdd && (
              <form action={addSavingsAccount}>
                <button type="submit" className={headerButton}>
                  <IconPlus className="h-4 w-4" />
                  Konto hinzufügen
                </button>
              </form>
            )}
            <HeaderTools />
          </div>
        </header>

        {/* Konten */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            // min-h-64: rund 50 % höher als der Inhalt braucht. Die Luft geht
            // an den Saldo-Bereich (flex-1 + items-end), der Betrag sitzt also
            // unten – Name oben, Zahl unten.
            <article key={a.id} className={`${tileFlush} min-h-64`}>
              <header className={filledHeader}>
                <EditableName
                  id={a.id}
                  name={a.name}
                  action={renameSavingsAccount}
                  ariaLabel="Name des Sparkontos"
                  className={tileHeading}
                  iconClassName="text-faint"
                />
                {canDelete && (
                  <form action={deleteSavingsAccount} className="shrink-0">
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit
                      message={`Sparkonto „${a.name}“ wirklich löschen? Alle Blöcke und Einträge dieses Kontos gehen unwiderruflich verloren.`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition hover:bg-red-500/20 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                    >
                      <IconTrash className="h-4 w-4" />
                    </ConfirmSubmit>
                  </form>
                )}
              </header>

              {/* Der Saldo-Bereich ist der Link ins Konto. Er ist bewusst vom
                  Namensfeld getrennt – sonst würde jeder Umbenenn-Versuch
                  navigieren. */}
              <Link
                href={`/dashboard/sparkonten/${a.id}`}
                className="flex flex-1 items-end justify-between gap-2 p-4 transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40 sm:p-5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">Saldo</p>
                  {/* Rot nur bei Minus – das ist keine Akzentfarbe, sondern
                      eine Aussage über die Zahl. */}
                  <p
                    className={`mt-1 ${bigNumber} ${
                      a.saldo >= 0 ? "text-ink" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatEuro(a.saldo)}
                  </p>
                </div>
                <span aria-hidden className="shrink-0 text-faint">
                  <IconChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
