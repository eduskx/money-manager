import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TagesgeldKind } from "@prisma/client";

import { auth } from "@/auth";
import { getSessionUser } from "@/lib/user";
import {
  computeTagesgeldTotals,
  getOrCreateTagesgeldBlocks,
  getSavingsAccount,
  sumEntries,
} from "@/lib/tagesgeld";
import { formatEuro } from "@/lib/format";
import { TagesgeldBlockCard } from "@/components/TagesgeldBlockCard";
import { AddCustomBlock } from "@/components/AddCustomBlock";
import { YearSwitcher } from "@/components/YearSwitcher";
import { HeaderTools } from "@/components/HeaderTools";
import {
  bigNumber,
  headerIconButton,
  tile,
  tileAccent,
  tileHeading,
} from "@/components/styles";
import { IconChevronLeft } from "@/components/icons";

// Ein einzelnes Sparkonto mit seinen Blöcken.
export default async function SparkontoPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;
  const account = await getSavingsAccount(session.user.id, accountId);
  if (!account) notFound();

  // Jahr aus der URL; weiter als das echte aktuelle Jahr geht es nicht.
  const maxYear = new Date().getFullYear();
  const sp = await searchParams;
  let year = Number(sp.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    year = maxYear;
  }
  if (year > maxYear) {
    redirect(`/dashboard/sparkonten/${accountId}?year=${maxYear}`);
  }

  const blocks = await getOrCreateTagesgeldBlocks(account.id);
  const totals = computeTagesgeldTotals(blocks);

  // Klappzustand der Blöcke (aus User.collapsed). Der User kostet dank
  // getSessionUser keine eigene Abfrage – das Layout hat ihn in derselben
  // Anfrage schon geholt. Offen, solange der Schlüssel nicht drinsteht.
  //
  // Die Schlüssel liegen seitenweit unter "sparkonten:" – der Klappzustand gilt
  // also fürs gesamte Sparkonten (über alle Konten hinweg), aber nur dort.
  // Standardblöcke hängen an ihrer Art (kind), eigene Blöcke an ihrem Namen.
  const profile = await getSessionUser();
  const collapsed = profile?.collapsed ?? [];
  const isOpen = (key: string) => !collapsed.includes(key);
  const kindKey = (kind: TagesgeldKind) => `sparkonten:${kind}`;
  const customKey = (name: string) => `sparkonten:custom:${name}`;

  const einnahmen = blocks.find((b) => b.kind === TagesgeldKind.EINNAHMEN);
  const ausgaben = blocks.find((b) => b.kind === TagesgeldKind.AUSGABEN);
  const zurueck = blocks.find((b) => b.kind === TagesgeldKind.ZURUECKGELEGT);
  const customBlocks = blocks.filter((b) => b.kind === TagesgeldKind.CUSTOM);

  // Einnahmen und Ausgaben werden pro Jahr angezeigt – der Saldo zählt aber
  // weiterhin alle Jahre zusammen.
  const einnahmenYear = (einnahmen?.entries ?? []).filter((e) => e.year === year);
  const ausgabenYear = (ausgaben?.entries ?? []).filter((e) => e.year === year);

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/sparkonten"
              aria-label="Zurück zur Sparkonten-Übersicht"
              className={headerIconButton}
            >
              <IconChevronLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-ink">{account.name}</h1>
              <p className="text-sm text-muted">Konto-Saldo über alle Jahre</p>
            </div>
          </div>

          <HeaderTools />
        </header>

        {/* Saldo-Übersicht. Der Kontostand ist die gefüllte Kachel – dasselbe
            Signal wie der Saldo im Dashboard. */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={tileAccent}>
            <h2 className={tileHeading}>Saldo</h2>
            <p className={`mt-3 ${bigNumber}`}>{formatEuro(totals.saldo)}</p>
            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-[13px]">
              <div className="flex items-baseline gap-2">
                <dt className="text-muted">Einnahmen</dt>
                <dd className="font-semibold tabular-nums">
                  {formatEuro(totals.einnahmen)}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-muted">Ausgaben</dt>
                <dd className="font-semibold tabular-nums">
                  {formatEuro(totals.ausgaben)}
                </dd>
              </div>
            </dl>
          </div>

          <div className={tile}>
            <h2 className={tileHeading}>Saldo exkl. Rücklagen</h2>
            <p className={`mt-3 ${bigNumber}`}>
              {formatEuro(totals.saldoExklZurueck)}
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-[13px]">
              <div className="flex items-baseline gap-2">
                <dt className="text-muted">Rücklagen</dt>
                <dd className="font-semibold tabular-nums">
                  {formatEuro(totals.zurueckgelegt)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Blöcke */}
        <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {einnahmen && (
            <TagesgeldBlockCard
              title="Einnahmen"
              blockId={einnahmen.id}
              entries={einnahmenYear}
              sum={sumEntries(einnahmenYear)}
              addYear={year}
              collapseKey={kindKey(TagesgeldKind.EINNAHMEN)}
              defaultOpen={isOpen(kindKey(TagesgeldKind.EINNAHMEN))}
              headerRight={
                <YearSwitcher
                  accountId={account.id}
                  year={year}
                  maxYear={maxYear}
                />
              }
            />
          )}

          {ausgaben && (
            <TagesgeldBlockCard
              title="Ausgaben"
              blockId={ausgaben.id}
              entries={ausgabenYear}
              sum={sumEntries(ausgabenYear)}
              addYear={year}
              collapseKey={kindKey(TagesgeldKind.AUSGABEN)}
              defaultOpen={isOpen(kindKey(TagesgeldKind.AUSGABEN))}
              headerRight={
                <YearSwitcher
                  accountId={account.id}
                  year={year}
                  maxYear={maxYear}
                />
              }
            />
          )}

          {zurueck && (
            <TagesgeldBlockCard
              title="Rücklagen"
              blockId={zurueck.id}
              entries={zurueck.entries}
              sum={sumEntries(zurueck.entries)}
              collapseKey={kindKey(TagesgeldKind.ZURUECKGELEGT)}
              defaultOpen={isOpen(kindKey(TagesgeldKind.ZURUECKGELEGT))}
            />
          )}

          {customBlocks.map((b) => (
            <TagesgeldBlockCard
              key={b.id}
              title={b.name}
              blockId={b.id}
              entries={b.entries}
              sum={sumEntries(b.entries)}
              deletable
              editableName
              collapseKey={customKey(b.name)}
              defaultOpen={isOpen(customKey(b.name))}
            />
          ))}

          <AddCustomBlock accountId={account.id} />
        </section>
      </div>
    </main>
  );
}
