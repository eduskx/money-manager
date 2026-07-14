import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  // Eingeloggt -> Dashboard, sonst -> Login.
  redirect(session?.user ? "/dashboard" : "/login");
}
