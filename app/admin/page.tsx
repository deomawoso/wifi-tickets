import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ZONE_STATUS, formatPrice } from "@/lib/format";
import Stat from "@/components/Stat";
import { setZoneStatus } from "./actions";

export default async function AdminPage() {
  const { supabase } = await requireRole(["admin"]);
  const { data: stats } = await supabase.rpc("admin_stats");

  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, city, district, status, created_at, profiles(full_name, phone)")
    .order("created_at", { ascending: false });

  return (
    <main className="page">
      <h1>Administration</h1>

      {stats && (
        <section className="stats">
          <Stat label="Utilisateurs" value={stats.users} />
          <Stat label="Zones actives" value={stats.zones_active} />
          <Stat label="Zones à valider" value={stats.zones_pending} />
          <Stat label="Retraits en attente" value={stats.payouts_pending} />
          <Stat label="Tickets en stock" value={stats.tickets_available} />
          {(stats.revenue ?? []).map((r: { currency: string; sales: number; commission: number }) => (
            <Stat
              key={r.currency}
              label={`Commission ${r.currency}`}
              value={formatPrice(r.commission, r.currency)}
              note={`${r.sales} vente(s)`}
            />
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/retraits" className="btn btn-ghost btn-sm">Retraits</Link>
        <Link href="/admin/utilisateurs" className="btn btn-ghost btn-sm">Utilisateurs</Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2>Zones Wi-Fi</h2>
        {zones && zones.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {zones.map((z) => {
              const manager = Array.isArray(z.profiles) ? z.profiles[0] : z.profiles;
              return (
                <li key={z.id} className="card">
                  <p className="font-medium">{z.name}</p>
                  <p className="text-sm muted">
                    {z.city}
                    {z.district ? `, ${z.district}` : ""}
                  </p>
                  <p className="text-sm muted">
                    Gérant : {manager?.full_name ?? "—"} {manager?.phone ?? ""}
                  </p>
                  <span className={`badge badge-${z.status}`}>{ZONE_STATUS[z.status] ?? z.status}</span>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {z.status !== "active" && (
                      <form action={setZoneStatus}>
                        <input type="hidden" name="zone_id" value={z.id} />
                        <input type="hidden" name="status" value="active" />
                        <button className="btn btn-sm">
                          Valider
                        </button>
                      </form>
                    )}
                    {z.status !== "suspended" && (
                      <form action={setZoneStatus}>
                        <input type="hidden" name="zone_id" value={z.id} />
                        <input type="hidden" name="status" value="suspended" />
                        <button className="btn btn-ghost btn-sm">
                          Suspendre
                        </button>
                      </form>
                    )}
                    {z.status !== "pending" && (
                      <form action={setZoneStatus}>
                        <input type="hidden" name="zone_id" value={z.id} />
                        <input type="hidden" name="status" value="pending" />
                        <button className="btn btn-ghost btn-sm">
                          Remettre en attente
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Aucune zone pour le moment.</p>
        )}
      </section>
    </main>
  );
}
