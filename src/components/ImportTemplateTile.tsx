import { importTemplate } from "@/lib/actions";
import { primaryButton, tileBase } from "@/components/styles";

// Der leere Zustand eines Monats: Er wurde noch nie erzeugt (oder wieder
// gelöscht). Statt des Budgets steht hier eine gestrichelte Kachel mit einem
// Knopf in der Mitte – erst der Klick holt die Vorlage in den Monat.
//
// Vorher entstand ein Monat automatisch beim bloßen Durchblättern. Das hatte
// einen unangenehmen Nebeneffekt: Wer nur mal „rüberschaute", hinterließ
// einen angelegten Monat. Jetzt ist das Erzeugen eine bewusste Entscheidung.
//
// Gestrichelt wie die „Neuer Block"-Karte der Sparkonten: Der Rahmen ohne
// Fläche heißt in dieser App „hier ist noch nichts".
export function ImportTemplateTile({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  return (
    <form
      action={importTemplate}
      className={`${tileBase} min-h-[320px] items-center justify-center gap-3 border-dashed border-line text-center shadow-none`}
    >
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <p className="text-sm text-muted">Dieser Monat ist noch leer.</p>

      <button type="submit" className={primaryButton}>
        Vorlage importieren
      </button>

      <p className="max-w-xs text-xs text-faint">
        Übernimmt Einnahmen, Ausgaben-Spalten und Abzüge aus deiner Vorlage.
        Danach kannst du den Monat frei anpassen.
      </p>
    </form>
  );
}
