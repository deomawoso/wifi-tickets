import { createBrowserClient } from "@supabase/ssr";

// Client utilisé dans les composants "use client" (navigateur)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
