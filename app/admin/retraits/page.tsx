import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PAYOUT_STATUS, formatDate, formatPrice, one } from "@/lib/format";
import { processPayout } from "../actions";

export default async function RetraitsPage() {
  const { supabase } = await requireRole(["admin"]);

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, amount, currency, phone, status, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="page">
      <Link href="/admin" className="link text-sm">← Administration</Link>
      <h1>Retraits</h1>
      <p className="muted text-sm">
        Envoyez l'argent au numéro indiqué avec votre application mobile money, puis cliquez sur « Marquer payé ». « Refuser » rend le montant au gérant.
      </p>

      {payouts && payouts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {payouts.map((p) => {
            const st = PAYOUT_STATUS[p.status] ?? { label: p.status, badge: "pending" };
            return (
              <li key={p.id} className="card">
                <div className="card-row">
                  <p className="ticket-price">{formatPrice(p.amount, p.currency)}</p>
                  <span className={`badge badge-${st.badge}`}>{st.label}</span>
                </div>
                <p>{one(p.profiles)?.full_name ?? "Gérant"}</p>
                <p className="muted text-sm">+{p.phone}, demandé le {formatDate(p.created_at)}</p>
                {p.status === "requested" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={processPayout}>
                      <input type="hidden" name="payout_id" value={p.id} />
                      <input type="hidden" name="status" value="paid" />
                      <button className="btn btn-sm">Marquer payé</button>
                    </form>
                    <form action={processPayout}>
                      <input type="hidden" name="payout_id" value={p.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button className="btn btn-ghost btn-sm">Refuser</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Aucune demande de retrait.</p>
      )}
    </main>
  );
}
