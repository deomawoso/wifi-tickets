"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("E-mail ou mot de passe incorrect.");
      return;
    }
    router.push("/compte");
    router.refresh();
  }

  return (
    <main className="page page-narrow page-center">
      <h1>Connexion</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="field"
          placeholder="Adresse e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="field"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-block"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {error && <p className="msg-bad">{error}</p>}

      <p className="text-sm muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="link">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
