import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  DURATIONS,
  ZONE_STATUS,
  formatDuration,
  formatPrice,
} from "@/lib/format";
import { createOffer, importTickets } from "../../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERREURS: Record<string, string> = {
  champs: "Vérifiez le nom, la durée et le prix de l'offre.",
  creation: "L'offre n'a pas pu être créée. Réessayez.",
  cle: "La clé de chiffrement n'est pas configurée sur le serveur.",
  fichier: "Fichier trop volumineux (500 Ko maximum).",
  vide: "Aucun code valide trouvé.",
  trop: "5 000 codes maximum par import.",
  import: "L'import a échoué. Réessayez.",
};

const inputClass =
  "field";

type SearchParams = {
  erreur?: string;
  importes?: string;
  doublons?: string;
  invalides?: string;
};

export default async function ZonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const { supabase, user } = await requireRole(["manager", "admin"]);

  const { data: zone } = await supabase
    .from("zones")
    .select("id, name, city, district, description, status")
    .eq("id", id)
    .eq("manager_id", user.id)
    .maybeSingle();
  if (!zone) notFound();

  const { data: offers } = await supabase
    .from("offers")
    .select("id, name, duration_minutes, price, currency, active")
    .eq("zone_id", id)
    .order("duration_minutes", { ascending: true });

  // Stock par offre (fonction SQL : les codes ne sont jamais envoyés au navigateur)
  const { data: stockRows } = await supabase.rpc("zone_stock", {
    p_zone_id: id,
  });
  const stock = new Map<
    string,
    { available: number; reserved: number; sold: number }
  >();
  for (const r of stockRows ?? []) {
    stock.set(r.o_offer_id, {
      available: Number(r.n_available),
      reserved: Number(r.n_reserved),
      sold: Number(r.n_sold),
    });
  }

  return (
    <main className="page">
      <Link href="/gerant" className="link text-sm">
        ← Mes zones
      </Link>

      <div>
        <h1>{zone.name}</h1>
        <p className="muted">
          {zone.city}
          {zone.district ? `, ${zone.district}` : ""}
        </p>
        <span className={`badge badge-${zone.status}`}>{ZONE_STATUS[zone.status] ?? zone.status}</span>
        {zone.status !== "active" && (
          <p className="mt-2 text-sm muted">
            Les offres ne seront visibles à la vente qu'une fois la zone validée.
          </p>
        )}
      </div>

      {sp.importes !== undefined && (
        <p className="notice notice-good">
          {sp.importes} ticket(s) ajouté(s). {sp.doublons ?? 0} doublon(s)
          ignoré(s). {sp.invalides ?? 0} ligne(s) invalide(s) ignorée(s).
        </p>
      )}
      {sp.erreur && (
        <p className="msg-bad">
          {ERREURS[sp.erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2>Offres et stock</h2>
        {offers && offers.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {offers.map((o) => {
              const s = stock.get(o.id) ?? { available: 0, reserved: 0, sold: 0 };
              return (
                <li
                  key={o.id}
                  className="card card-tight"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {o.name}{" "}
                      <span className="muted">
                        · {formatDuration(o.duration_minutes)}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatPrice(o.price, o.currency)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-sm ${
                      s.available === 0 ? "msg-bad" : "muted"
                    }`}
                  >
                    {s.available} disponible(s) · {s.sold} vendu(s)
                    {s.reserved > 0 ? `, ${s.reserved} en cours` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Aucune offre pour le moment.</p>
        )}
      </section>

      {offers && offers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2>Importer des tickets</h2>
          <p className="text-sm muted">
            Un code par ligne (fichier .csv ou .txt, ou collez-les ci-dessous).
            Les doublons sont ignorés. 5 000 codes maximum par import.
          </p>
          <form action={importTickets} className="flex flex-col gap-3">
            <input type="hidden" name="zone_id" value={zone.id} />
            <select className={inputClass} name="offer_id" required>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}, {formatDuration(o.duration_minutes)}
                </option>
              ))}
            </select>
            <input
              className="text-sm"
              type="file"
              name="file"
              accept=".csv,.txt,text/csv,text/plain"
            />
            <textarea
              className={inputClass}
              name="codes"
              rows={5}
              placeholder="Ou collez les codes ici, un par ligne"
            />
            <button className="btn btn-block">
              Importer les tickets
            </button>
          </form>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2>Ajouter une offre</h2>
        <form action={createOffer} className="flex flex-col gap-3">
          <input type="hidden" name="zone_id" value={zone.id} />
          <input
            className={inputClass}
            name="name"
            placeholder="Nom de l'offre (ex. Pass 1 heure)"
            required
          />
          <select
            className={inputClass}
            name="duration_minutes"
            defaultValue="60"
          >
            {DURATIONS.map((d) => (
              <option key={d.minutes} value={d.minutes}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <input
              className={`${inputClass} flex-1`}
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Prix"
              required
            />
            <select className={inputClass} name="currency" defaultValue="CDF">
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <button className="btn btn-block">
            Ajouter l'offre
          </button>
        </form>
      </section>
    </main>
  );
}
