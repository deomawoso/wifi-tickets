import { createClient } from "@supabase/supabase-js";

// Client « administrateur » : il contourne toutes les règles de sécurité de la base.
// À utiliser UNIQUEMENT dans du code serveur (actions serveur, pages serveur).
// Ne jamais l'importer dans un composant "use client".
export function adminReady(): boolean {
  return !!process.env.SUPABASE_SECRET_KEY;
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY manquante");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
