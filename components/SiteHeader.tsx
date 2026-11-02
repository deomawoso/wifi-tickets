import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = data?.role ?? null;
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M3 9a13 13 0 0 1 18 0" />
              <path d="M6.5 12.5a8 8 0 0 1 11 0" />
              <path d="M10 16a3 3 0 0 1 4 0" />
              <circle cx="12" cy="19.5" r=".8" fill="currentColor" />
            </svg>
          </span>
          Tickets Wi-Fi
        </Link>

        <nav className="nav" aria-label="Navigation principale">
          <Link href="/zones">Zones</Link>
          {(role === "manager" || role === "admin") && <Link href="/gerant">Gérant</Link>}
          {role === "admin" && <Link href="/admin">Admin</Link>}
          {user ? (
            <Link href="/compte">Mon compte</Link>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>
              <Link href="/inscription" className="btn btn-sm">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
