import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/user";

// Fängt einen Fall ab, den es erst seit dem Gast-Modus gibt: eine gültige
// Session, deren Nutzer nicht mehr existiert.
//
// Wie das passiert: Ein Gast-Konto lebt GUEST_TTL_DAYS (7 Tage), das
// Session-Cookie aber 30. Wer nach acht Tagen mit gültigem Cookie zurückkommt,
// dessen Konto hat der Aufräumer längst gelöscht. Die Seiten würden dann
// versuchen, einen Monat für eine nicht mehr existierende userId anzulegen –
// und über den Fremdschlüssel mit einem 500er abstürzen.
//
// Der Check steht hier im Layout, weil er damit für JEDE Dashboard-Seite gilt.
// Im Root-Layout ginge es nicht: Das umschließt auch /login, und ein Redirect
// dorthin würde sich endlos im Kreis drehen.
//
// Kostet dank getSessionUser keine eigene Abfrage – das Root-Layout hat den
// Nutzer in derselben Anfrage schon geholt.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <>{children}</>;
}
