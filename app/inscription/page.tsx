"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export default function InscriptionPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Ces valeurs sont copiées dans la table "profiles" par le déclencheur SQL
      options: { data: { full_name: fullName, phone } },
    });

    setLoading(false);

    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    if (data.session) {
      router.push("/compte");
      router.refresh();
    } else {
      setMessage(
        "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse."
      );
    }
  }

  return (
    <main className="page page-narrow page-center">
      <h1>Créer un compte</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="field"
          placeholder="Nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          className="field"
          placeholder="Téléphone (ex. +243 8x xxx xxxx)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
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
          placeholder="Mot de passe (8 caractères minimum)"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1" />
          <span>
            J'accepte les{" "}
            <Link href="/conditions" className="link">conditions d'utilisation</Link> et la{" "}
            <Link href="/confidentialite" className="link">politique de confidentialité</Link>.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-block"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      {error && <p className="msg-bad">{error}</p>}
      {message && <p className="good-text">{message}</p>}

      <p className="text-sm muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="link">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
