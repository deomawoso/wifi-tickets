import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Vérifie que l'utilisateur est connecté et a l'un des rôles demandés.
// Sinon, redirige. Les règles RLS de la base restent la vraie protection.
export async function requireRole(roles: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !roles.includes(profile.role)) redirect("/compte");

  return { supabase, user, profile };
}
