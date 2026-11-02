import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ZONE_STATUS, formatPrice } from "@/lib/format";
import Stat from "@/components/Stat";
import { createZone } from "./actions";

const ERREURS: Record<string, string> = {
  champs: "Le nom et la ville sont obligatoires.",
  creation: "La zone n'a pas pu être créée. Réessayez.",
};

const inputClass =
  "field";

export default async function GerantPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { supabase, user } = await requireRole(["manager", "admin"]);
  const { erreur } = await searchParams;
  const { data: stats } = await supabase.rpc("manager_stats");

  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, city, district, status")
    .eq("manager_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="page">
      <h1>Espace gérant</h1>

      {stats && (
        <section className="stats">
          <Stat label="Zones" value={stats.zones} />
          <Stat label="Tickets en stock" value={stats.available} />
          <Stat label="Tickets vendus" value={stats.sold} />
          {Object.entries(stats.gains_30j ?? {}).map(([cur, v]) => (
            <Stat key={cur} label="Gains sur 30 jours" value={formatPrice(Number(v), cur)} />
          ))}
        </section>
      )}

      <Link href="/gerant/portefeuille" className="card card-link">
        <p className="font-semibold">Portefeuille</p>
        <p className="muted text-sm">Vos gains et vos retraits</p>
      </Link>

      <section className="flex flex-col gap-3">
        <h2>Mes zones Wi-Fi</h2>
        {zones && zones.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {zones.map((z) => (
              <li key={z.id}>
                <Link
                  href={`/gerant/zones/${z.id}`}
                  className="card card-link"
                >
                  <p className="font-medium">{z.name}</p>
                  <p className="text-sm muted">
                    {z.city}
                    {z.district ? `, ${z.district}` : ""}
                  </p>
                  <span className={`badge badge-${z.status}`}>{ZONE_STATUS[z.status] ?? z.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Vous n'avez pas encore de zone.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2>Ajouter une zone</h2>
        <form action={createZone} className="flex flex-col gap-3">
          <input className={inputClass} name="name" placeholder="Nom de la zone" required />
          <input className={inputClass} name="city" placeholder="Ville" required />
          <input className={inputClass} name="district" placeholder="Quartier (facultatif)" />
          <textarea
            className={inputClass}
            name="description"
            placeholder="Description (facultatif)"
            rows={3}
          />
          <button className="btn btn-block">
            Créer la zone
          </button>
        </form>
        {erreur && (
          <p className="msg-bad">{ERREURS[erreur] ?? "Une erreur est survenue."}</p>
        )}
        <p className="text-sm muted">
          Une nouvelle zone est vérifiée avant d'apparaître à la vente.
        </p>
      </section>
    </main>
  );
}
