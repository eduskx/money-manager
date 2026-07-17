import type { Metadata } from "next";
import "./globals.css";
import { DEFAULT_PALETTE, paletteAttr } from "@/lib/palette";
import { getSessionUser } from "@/lib/user";
import { InlineScript } from "@/components/InlineScript";

export const metadata: Metadata = {
  title: "Monatsblick",
  description: "Behalte deine Finanzen im Blick.",
};

// Läuft synchron beim Parsen der Seite – also VOR dem ersten Paint, damit beim
// Laden nichts von hell nach dunkel (oder umgekehrt) umspringt.
//
// Regel für hell/dunkel – dieselbe wie bei der Farbwelt, nur woanders
// gespeichert: Wer selbst umgeschaltet hat, bekommt seine Wahl (sie steht in
// localStorage). Wer nie umgeschaltet hat, folgt der Systemeinstellung.
//
// Deshalb die drei Fälle: "dark" -> dunkel, "light" -> hell, nichts -> das,
// was das Betriebssystem sagt.
//
// Warum localStorage und nicht die DB wie bei der Farbwelt? Hell/Dunkel hängt
// am Gerät (Handy abends dunkel, Arbeitsrechner hell), die Farbwelt am
// Geschmack. Deshalb lebt es dort, wo das Gerät ist.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Die Farbwelt hängt am Nutzer. Den Standard sehen drei Gruppen: wer nicht
  // angemeldet ist (Login, Registrierung), wer noch nie eine Farbe gewählt hat
  // (palette ist dann null) – und wer neu dazukommt.
  //
  // getSessionUser fragt die DB nur beim ersten Aufruf pro Anfrage; die
  // anderen Stellen (Dashboard-Layout, Seite, HeaderTools) bekommen dasselbe
  // Ergebnis geschenkt.
  const user = await getSessionUser();
  const palette = user?.palette ?? DEFAULT_PALETTE;

  return (
    <html
      lang="de"
      className="h-full antialiased"
      data-palette={paletteAttr(palette)}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
