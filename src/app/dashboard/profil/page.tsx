import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GUEST_TTL_DAYS } from "@/lib/guest";
import { getSessionUser } from "@/lib/user";
import { ProfileSettings } from "@/components/ProfileSettings";
import { HeaderTools } from "@/components/HeaderTools";
import { headerIconButton } from "@/components/styles";
import { IconChevronLeft } from "@/components/icons";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Kostet keine eigene Abfrage – siehe getSessionUser.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Ablaufdatum eines Gast-Kontos. Bewusst hier formatiert und als Text
  // weitergegeben: Der Server kennt die Zeitzone, der Client würde beim
  // Hydrieren sonst ein anderes Datum rendern als der Server.
  const guestExpiresAt = user.isGuest
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
        new Date(user.createdAt.getTime() + GUEST_TTL_DAYS * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
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
              <h1 className="text-2xl font-semibold text-ink">Profil</h1>
              <p className="text-sm text-muted">Konto &amp; Einstellungen</p>
            </div>
          </div>

          {/* Kein Profil-Icon – man ist ja schon hier. */}
          <HeaderTools showProfile={false} />
        </header>

        <div className="mt-6">
          <ProfileSettings
            name={user.name ?? ""}
            email={user.email}
            isGuest={user.isGuest}
            guestExpiresAt={guestExpiresAt}
          />
        </div>
      </div>
    </main>
  );
}
