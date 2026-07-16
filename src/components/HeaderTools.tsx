import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PALETTE } from "@/lib/palette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteToggle } from "@/components/PaletteToggle";
import { headerIconButton } from "@/components/styles";
import { IconUser } from "@/components/icons";

// Die Werkzeuge rechts oben – auf jeder Seite dieselben, in derselben
// Reihenfolge: Hell/Dunkel, Farbwelt, Profil.
//
// Holt die Farbwelt selbst aus der DB, statt sie von jeder Seite als Prop zu
// verlangen. So kann keine Seite vergessen, sie durchzureichen.
//
// `showProfile`: auf der Profilseite selbst aus – ein Link auf die Seite, auf
// der man schon steht, hilft niemandem.
export async function HeaderTools({
  showProfile = true,
}: {
  showProfile?: boolean;
}) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { palette: true },
      })
    : null;

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <PaletteToggle palette={user?.palette ?? DEFAULT_PALETTE} />
      {showProfile && (
        <Link
          href="/dashboard/profil"
          aria-label="Profil"
          title="Profil"
          className={headerIconButton}
        >
          <IconUser className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
