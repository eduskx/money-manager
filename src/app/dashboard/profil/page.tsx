import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettings } from "@/components/ProfileSettings";
import { HeaderTools } from "@/components/HeaderTools";
import { headerIconButton } from "@/components/styles";
import { IconChevronLeft } from "@/components/icons";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

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
          <ProfileSettings name={user.name ?? ""} email={user.email} />
        </div>
      </div>
    </main>
  );
}
