// Ein Inline-Script, das der Browser beim Parsen der Seite ausführt – also vor
// dem ersten Paint. Genau dafür gibt es kein React-Äquivalent.
//
// Der Typ-Trick stammt aus den Next-Docs („Preventing Flash Before Hydration"):
// Auf dem Server wird ein echtes `text/javascript` ausgeliefert (der Browser
// führt es beim Hard-Load aus). Im Client rendert React `text/plain` – dadurch
// entfällt die Warnung „Encountered a script tag while rendering React
// component", denn ein text/plain-Script wird ohnehin nie ausgeführt.
// `suppressHydrationWarning` deckt den Typ-Unterschied ab.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
