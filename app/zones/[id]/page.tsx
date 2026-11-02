import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatPrice } from "@/lib/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ZonePubliquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();

  const { data: zone } = await supabase
    .from("zones")
    .select("id, name, city, district, description")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (!zone) notFound();

  const { data: offers } = await supabase
    .from("offers")
    .select("id, name, duration_minutes, price, currency")
    .eq("zone_id", id)
    .eq("active", true)
    .order("duration_minutes", { ascending: true });

  // Disponibilité (nombres uniquement, jamais les codes)
  const { data: stockRows } = await supabase.rpc("public_stock", {
    p_zone_id: id,
  });
  const available = new Map<string, number>();
  for (const r of stockRows ?? []) {
    available.set(r.o_offer_id, Number(r.n_available));
  }

  return (
    <main className="page">
      <Link href="/zones" className="link text-sm">
        ← Toutes les zones
      </Link>

      <div>
        <h1>{zone.name}</h1>
        <p className="muted">
          {zone.city}
          {zone.district ? `, ${zone.district}` : ""}
        </p>
        {zone.description && <p className="mt-2">{zone.description}</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2>Choisissez votre pass</h2>
        {offers && offers.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {offers.map((o) => {
              const inStock = (available.get(o.id) ?? 0) > 0;
              return (
                <li key={o.id} className="ticket">
                  <div className="ticket-main">
                    <p className="font-semibold">{o.name}</p>
                    <p className="muted">{formatDuration(o.duration_minutes)}</p>
                  </div>
                  <div className="ticket-stub">
                    <p className="ticket-price">{formatPrice(o.price, o.currency)}</p>
                    {inStock ? (
                      <Link href={`/acheter/${o.id}`} className="btn btn-sm">
                        Acheter
                      </Link>
                    ) : (
                      <span className="msg-bad text-sm">Épuisé</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Aucune offre disponible.</p>
        )}
      </section>
    </main>
  );
}
