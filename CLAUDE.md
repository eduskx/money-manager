@AGENTS.md

# Money Manager — Projektkontext

Persönliche Finanz-Tracking-App. Herzensprojekt des Nutzers, der damit auch
**TypeScript lernen** möchte (kommt von React/Next.js). Antworten & Kommentare
auf **Deutsch**. Erklärend, nicht nur abliefern — der Nutzer will verstehen.

Die App bildet das Excel-Budget des Nutzers ab: pro Monat **Einnahmen**, frei
benennbare **Ausgaben-Spalten** und ein **Saldo** („was bleibt"), dazu eine
**Vorlage** als Grundlage für neue Monate und **Sparkonten** für Rücklagen.

## Stack

- Next.js 16 (App Router, `proxy.ts` statt `middleware.ts`), TypeScript
- Prisma 6 + PostgreSQL (Neon). **Bewusst Prisma 6**, nicht 7 (7 verlangt
  Driver-Adapter-Config, für den Einstieg zu komplex).
- Auth.js v5 (NextAuth), Credentials-Provider (E-Mail/Passwort), JWT-Sessions.
- Tailwind CSS v4 (klassenbasierter Dark-Mode via `@custom-variant`).

## Umgebung & Verifikation — WICHTIG

- **Verifikation = `npm run lint` + `npm run build`.** Beides muss grün sein.
- **Live-Klicktest geht über den Gast-Login.** Echte Konten brauchen ein
  Passwort (gibt der Assistent nicht ein), der Knopf „Als Gast anmelden" aber
  nicht — darüber kann der Assistent das Dashboard selbst öffnen und prüfen (so
  wurde der Swatch-Bug gefunden). Konto-Spezifisches testet weiterhin der Nutzer.
- **`prisma generate` scheitert mit `EPERM`, solange `next dev` läuft** (die
  Engine-DLL ist gesperrt). Die TS-Typen werden trotzdem erneuert, deshalb
  laufen `lint`/`build` weiter — aber der **laufende Dev-Server behält den alten
  Client im Speicher**. Symptom: `prisma.<model> is undefined` zur Laufzeit.
  Lösung: Dev-Server stoppen → `npx prisma migrate dev` → neu starten.
- **Turbopack-Dev cached CSS per Inhalts-Hash.** Neue *handgeschriebene* Regeln
  in `globals.css` (keine Tailwind-Utilities) übernimmt der laufende Dev-Server
  manchmal nicht — HMR greift nicht, und `touch` hilft nicht (gleicher Inhalt →
  gleicher Hash → Cache-Treffer). `lint`/`build` sind trotzdem grün, weil der
  Build sauber neu kompiliert. Lösung: Dev-Server neu starten. So verschwand der
  „Vorschau-Punkte zeigen nichts"-Bug.
- **Nach dem Löschen von Routen `.next` leeren**, sonst schlägt der Typecheck
  mit veralteten generierten Typen fehl.
- Aus manchen Sessions ist `neon.tech` per Egress-Policy geblockt → dort keine
  Migrationen. **Migrationen werden deshalb von Hand geschrieben** (offline mit
  `npx prisma migrate diff --from-empty --to-schema-datamodel … --script` als
  Vorlage für exakte Namen) und vom Nutzer lokal ausgeführt.

## Datenmodell (`prisma/schema.prisma`)

```
User ─┬─ Month ─┬─ Entry ── (columnId) ── ExpenseColumn
      │         └─ ExpenseColumn
      └─ SavingsAccount ── TagesgeldBlock ── TagesgeldEntry
```

- **`Month`** = ein Budget-Monat **oder die Vorlage** (`isTemplate`, dann
  `year/month = null`). Jeder Monat ist eine eigenständige Kopie: Eine
  Vorlage-Änderung wirkt **nicht** rückwirkend (kein Sync, kein `customized`-Flag
  mehr).
- **`Entry`**: `section ∈ {INCOME, EXPENSE, RUECKLAGE}`. Bei `EXPENSE` steht die
  konkrete Spalte in **`columnId`** (die Spalten sind KEIN Enum mehr).
  `amount Decimal(12,2)`, optional **`formula`** (siehe unten).
- **`ExpenseColumn`** `{ name, position, monthId }` — frei benennbar,
  max. **`MAX_EXPENSE_COLUMNS = 5`** (in `month.ts`). Neue Vorlage startet mit
  EINER Spalte „Fixkosten".
- **`SavingsAccount`** `{ name, position, userId }` — max.
  **`MAX_SAVINGS_ACCOUNTS = 5`** (in `tagesgeld.ts`). Das **letzte Konto lässt
  sich nicht löschen** (sonst wäre die Übersicht leer).
- **`TagesgeldBlock`** `{ kind ∈ EINNAHMEN|AUSGABEN|ZURUECKGELEGT|CUSTOM }` —
  hängt am **Konto** (`accountId`), NICHT mehr am User.
- **`TagesgeldEntry`**: `year` nur bei EINNAHMEN/AUSGABEN gesetzt.

## Kernlogik & Semantik (das Nicht-Offensichtliche)

**`src/lib/month.ts`**
- **„Vormonat" wird NICHT gespeichert, sondern berechnet.** `computeChain` /
  `loadMonthChain` reichen den Restbetrag in den jeweils nächsten
  **vorhandenen** Monat weiter — **Lücken werden übersprungen** (Februar
  gelöscht → Januar-Rest fließt in den März). Ändert sich ein früherer Monat,
  ziehen alle folgenden automatisch nach. In der UI eine nicht-editierbare
  Zeile im Einnahmen-Block; kommt der Übertrag über eine Lücke, heißt sie
  nicht „Vormonat", sondern „Übertrag aus ‹Monat Jahr›" (`carryFrom`).
- **Kein Vorlagen-Sync (mehr).** Die Vorlage ist ausschließlich die **Grundlage
  für neu importierte Monate** (`importMonthFromTemplate`). Bestehende Monate
  bleiben unberührt; wer die neue Vorlage in einem Monat will, **löscht ihn und
  importiert neu**. Früher spiegelten unberührte Monate die Vorlage automatisch
  (`applyTemplateToMonths` + `customized`-Flag) — beides ist entfernt.
- **Monate entstehen NICHT mehr automatisch.** Ein nie erzeugter Monat zeigt
  eine gestrichelte Kachel mit „Vorlage importieren" (`ImportTemplateTile`);
  erst der Klick ruft `importMonthFromTemplate` (`buildCopy`,
  Spalten-Zuordnung über `position`). Bloßes Durchblättern legt nichts an.
  `getMonth` liefert deshalb `Month | null`. Monat löschen = Zeile weg, man
  **bleibt** auf dem Monat (kein Redirect). „Generiert" = Zeile existiert —
  der `MonthSwitcher` markiert diese Monate farbig (`generatedKeys`, Format
  wie `monthKey()`). Der Gast-Seed legt den aktuellen Monat deshalb selbst an.
- `loadMonthView` (+ `flattenEntries`) liefert die Ansicht;
  `Totals = { income, ausgaben, ruecklagen, restbetrag }`.
- Monatsgrenze: **höchstens der Folgemonat** (`maxSelectableMonth`: aktueller
  Monat + 1, im Dezember der Januar des Folgejahres; `isMonthAfter`) —
  serverseitiger Guard + UI (Jahr-vor-Knopf im `MonthSwitcher` ab dem
  Grenzjahr gesperrt).

**`src/lib/tagesgeld.ts`**
- `Saldo = Σ Einnahmen − Σ Ausgaben` (**kumulativ über alle Jahre**);
  `Saldo exkl. Rücklagen = Saldo − Σ Rücklagen`. **CUSTOM-Blöcke (ETF, Aktien,
  Krypto) zählen NICHT in den Saldo.**
- Einnahmen und Ausgaben laufen **pro Jahr** (gemeinsames `?year=`), Grenze =
  echtes aktuelles Jahr. Rücklagen + CUSTOM bleiben konto-gesamt (ohne Jahr).

**`src/lib/calc.ts`** (client-sicher, **kein** Prisma-Import!)
- Betragsfelder verstehen **Excel-Formeln**: `=60+30`, `100/4`, `(60+40)*2`.
  `parseAmount` + `isFormulaInput` + eigener Ausdrucks-Parser — **kein `eval`**.
- **`Entry.formula` / `TagesgeldEntry.formula`** speichern die Formel zusätzlich
  zum Ergebnis: Ruhezustand zeigt das Ergebnis, beim Fokus erscheint die Formel.
  Beim Label-Speichern wird die Formel unverändert mitgeschickt, sonst geht sie
  verloren. Betragsfelder haben `inputMode="text"` (Operatoren tippbar).

## Konventionen

- **Secrets nur in `.env`** (gitignored). Schema-Änderungen **immer als
  Migration**, nie per `db push`.
- Beträge: `Decimal(12,2)` in der DB, im Server-Component per `Number()`.
- Alles unter `/dashboard/…` ist durch `src/proxy.ts` (authorized-Callback in
  `auth.config.ts`) automatisch geschützt.
- **Besitzprüfung in jeder Action** über Relation-Filter, nie nur über die ID:
  `where: { id, month: { userId } }` bzw. `{ id, block: { account: { userId } } }`.
- **Bearbeiten — eine Regel für die ganze App, Handy wie PC:**
  - **Werte** (Zeilen-Bezeichnung, Betrag) → **direkt anklickbar**.
  - **Namen/Überschriften** (Sparkonto, Ausgaben-Spalte, Block) → erst über das
    **Stift-Icon** bearbeitbar. Dafür gibt es genau eine Komponente:
    **`src/components/EditableName.tsx`** (nimmt die Server-Action als Prop).
    Neue umbenennbare Namen IMMER darüber lösen, nicht neu bauen.
- **Anlegen — auch eine Regel:** Button legt sofort an („Neue Spalte", „Neues
  Konto", „Neuer Block"), benannt wird danach per Stift. Kein Namensfeld vorab.
- **Klappzustand der Blöcke** liegt am Nutzer (`User.collapsed String[]`,
  gespeichert werden nur die *eingeklappten* Schlüssel; fehlt einer → offen).
  Die Schlüssel sind **seitenbezogen**, nicht pro Monat: `dashboard:…`,
  `vorlage:…`, `sparkonten:…`. So teilen sich im Dashboard alle Monate einen
  Zustand (Ausgaben-Spalten über ihren **Namen** verknüpft, Sparkonto-Blöcke
  über ihre Art `kind` bzw. bei eigenen über ihren Namen). Eine Komponente
  dafür: der Hook **`src/components/useCollapse.ts`** (optimistisch + Server-
  Action `setBlockCollapsed`, bewusst **ohne** `revalidatePath`). CollapsibleBlock,
  BudgetColumn und TagesgeldBlockCard nehmen `collapseKey` + `defaultOpen` von
  der jeweiligen Seite.
- **Layout:** alle Flex-/Grid-Elemente in Eintragszeilen brauchen **`min-w-0`**,
  sonst überlaufen die Ausgaben-Spalten ineinander (war ein echter Bug).
- Destruktives immer mit `ConfirmSubmit` (Rückfrage) und rot abgesetzt.
- Anzeigename/E-Mail werden **aus der DB** gelesen (nicht aus dem JWT), damit
  Profil-Änderungen sofort sichtbar sind.

## Farben — KEINE Farbe gehört in eine Komponente

Die Oberfläche kennt nur **Rollen**, nie Farbwerte: `bg-canvas`, `bg-surface`,
`bg-sunken`, `text-ink`, `text-muted`, `text-faint`, `bg-accent`,
`text-on-accent`, `bg-saldo`, `border-line`. Definiert sind sie **ausschließlich
in `globals.css`**, je Welt und Modus. Neue UI immer über die Rollen bauen —
kein `bg-gray-50`, kein `emerald`.

- **7 Farbwelten** (Graphit · Indigo · Marine · Salbei · Pflaume · Sand · Rosé), jede
  mit Hell- und Dunkel-Satz. Quelle der Werte ist das Artefakt der Entwürfe;
  Abweichungen davon sind Fehler, keine Freiheit.
- **`User.palette` ist nullbar**: `null` = „nie gewählt" → es gilt
  `DEFAULT_PALETTE` (Graphit) aus `src/lib/palette.ts`. Bewusst **kein**
  DB-Default — sonst wäre „nie gewählt" nicht von „genau das gewählt"
  unterscheidbar. Standard ändern = eine Zeile dort (+ der `:root`-Block in
  `globals.css`), keine Migration.
- **Hell/Dunkel** liegt dagegen in `localStorage` (hängt am Gerät, nicht am
  Geschmack). Nie umgeschaltet → Systemeinstellung.
- **`@theme inline`** ist Pflicht: Nur dadurch erzeugt Tailwind
  `color: var(--ink)` statt einer Indirektion — und nur dadurch funktioniert
  **`.saldo-scope`**, das die Rollen im Teilbaum der gefüllten Saldo-Kachel
  umdefiniert. So bleiben `EntryRow` & Co. darauf lesbar, ohne Sondervariante.
- **Rot und Grün bleiben hart kodiert**: Löschen/Fehler = rot, Erfolg = grün.
  Das sind Aussagen, keine Akzente, und sollen in jeder Welt gleich lesen.
- **Gemeinsame Bausteine in `src/components/styles.ts`** (`tile`, `tileAccent`,
  `tileFlush`, `filledHeader`, `tileHeading`, `bigNumber`, `sumRow`,
  `primaryButton`, `fieldClass` …). Kacheln immer daher nehmen.
- **`tileBase` enthält absichtlich KEINEN Hintergrund.** Stehen `bg-surface` und
  `bg-saldo` am selben Element, entscheidet die Reihenfolge im **erzeugten
  Stylesheet**, nicht die im `className` — daran ist die Saldo-Kachel schon
  einmal unsichtbar geworden. Nicht „aufräumen".
- **`HeaderTools`** rendert Theme + Palette + Profil und holt die Farbwelt
  selbst aus der DB. Kopfzeilen immer darüber, nicht nachbauen.
- **Farbwelten-Wähler = Dropdown** (`PaletteToggle`, war früher ein
  Durchschalt-Knopf), mit einem **Vorschau-Punkt je Welt**. Diese Punkte sind
  die **einzige weitere Ausnahme** von „Farbe nur als Rolle": Weil das Menü alle
  7 Welten gleichzeitig zeigt, stehen ihre Akzentwerte als `.swatch-<welt>`-
  Klassen (hell **und** dunkel) in `globals.css`. Ändert sich ein `--accent`,
  gehört der passende Swatch mitgeändert. **Nicht** in eine Komponente ziehen,
  und nicht als „toten Code" entfernen.
- **Eingabefelder tragen die Fläche ihres Blocks.** In den Ausgaben-Spalten
  (`bg-sunken`) bekommen `EntryRow`/`AddEntry` per **`onSunken`** denselben
  Hintergrund statt `bg-surface` — sonst stäche das aufklappende Bearbeitungsfeld
  hell heraus. In den normalen Blöcken (Einnahmen/Abzüge, `bg-surface`) bleibt es
  bei `bg-surface`.

## Routen

| Route | Inhalt |
|---|---|
| `/dashboard` | Monatsansicht (Einnahmen · Ausgaben-Spalten · Saldo), `?y=&m=` |
| `/dashboard/vorlage` | Vorlage — gleicher Aufbau, nutzt dieselben Komponenten |
| `/dashboard/sparkonten` | Übersicht: Name + Saldo je Konto |
| `/dashboard/sparkonten/[accountId]` | Ein Konto mit seinen Blöcken, `?year=` |
| `/dashboard/profil` | Name / E-Mail / Passwort ändern, Abmelden, Konto löschen |

## Stand & offene Punkte

- **Gemerged in `main`:** PR #2 (Excel-Budgetlogik), #3 (Profil),
  #4 + #6 (flexible Spalten), #5 (Sparkonten).
- **Farbwelten + Bento-Layout sind umgesetzt** (7 Welten, hell/dunkel,
  Palette-Dropdown mit Vorschau-Punkten) — der frühere `design`-Branch ist damit
  abgeschlossen.
- **Aktueller Branch `small-additions`** (diese Session): Klappzustand pro Konto
  gespeichert (`User.collapsed`, seitenbezogen), Farbwelten-Wähler als Dropdown
  mit Vorschau-Punkten, Eingabefeld-Fläche in Ausgaben-Spalten (`onSunken`), und
  die **Vorlage wirkt nicht mehr rückwirkend** (automatischer Sync +
  `customized`-Flag entfernt; ein Monat übernimmt die Vorlage nur beim Import).
- **Bento-Layout ist umgesetzt** (nicht mehr nur Mockup): PC = Einnahmen oben
  links, Saldo oben rechts, Ausgaben volle Breite darunter. Handy = Saldo,
  Einnahmen, Ausgaben. Anteilsbalken (Anteil an den Einnahmen) unter den
  Spalten-Köpfen und bei den Abzügen — eine Formel, eine Komponente.
- **E-Mail-Änderung ohne Verifizierungs-Mail** (passwortgeschützt, sofort
  wirksam). Echte Verifizierung bräuchte einen Mail-Dienst (Resend/SMTP) +
  Token-Flow — bewusst vertagt.
- **Deployment** wurde angefangen, aber nicht abgeschlossen (Vercel + Neon;
  nötig wären `DATABASE_URL` und `AUTH_SECRET` als Env-Vars).
- **Gast-Modus ist umgesetzt** (`src/lib/guest.ts`). Zweck: Recruitern die App
  ohne Registrierung zeigen. Entschieden gegen eine reine localStorage-Lösung
  (wäre eine zweite Implementierung der halben App und würde ausgerechnet die
  Server-Logik verstecken, die das Projekt interessant macht). Umsetzung wie
  empfohlen: anonymes Konto in der DB (`isGuest`), **mit Beispieldaten** (ein
  leerer Gast zeigt nichts) und Lazy-Cleanup alter Gäste beim nächsten
  Gast-Login — kein Cron nötig. Speicher ist kein Argument: ~10 KB pro Gast.
- **Nebenwirkung des Farbwelten-Umbaus:** `/login`, `/register` und
  `/_not-found` sind von statisch auf dynamisch gewechselt, weil das
  Root-Layout die Session für `data-palette` liest. Kosten: ein Cookie-Check
  pro Aufruf, kein DB-Zugriff.
- **Kein 3-Zustands-Theme-Knopf:** Wer einmal hell/dunkel wählt, kommt nicht
  mehr auf „Systemeinstellung folgen" zurück (der `localStorage`-Eintrag
  bleibt). Bewusst offen gelassen.
