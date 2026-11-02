import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PAYOUT_STATUS, formatDate, formatPrice, one } from "@/lib/format";
import { requestPayout } from "./actions";

const ERREURS: Record<string, string> = {
  montant: "Montant invalide.",
  telephone: "Numéro invalide. Exemple : 0854452834.",
  solde: "Solde insuffisant pour ce retrait.",
  echec: "La demande n'a pas pu être enregistrée. Réessayez.",
};

export default async function PortefeuillePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { supabase, user } = await requireRole(["manager", "admin"]);
  const sp = await searchParams;

  const { data: balances } = await supabase.rpc("my_balances");

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, amount, currency, phone, status, created_at")
    .eq("manager_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: sales } = await supabase
    .from("orders")
    .select("id, amount, commission, currency, paid_at, offers(name)")
    .in("status", ["paid", "delivered"])
    .order("paid_at", { ascending: false })
    .limit(10);

  return (
    <main className="page">
      <Link href="/gerant" className="link text-sm">← Espace gérant</Link>
      <h1>Portefeuille</h1>

      <section className="flex flex-col gap-3">
        <h2>Solde disponible</h2>
        {balances && balances.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {balances.map((b: { o_currency: string; n_balance: number }) => (
              <div key={b.o_currency} className="card">
                <p className="ticket-price">{formatPrice(b.n_balance, b.o_currency)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Aucun gain pour le moment.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2>Demander un retrait</h2>
        <form action={requestPayout} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input className="field flex-1" name="amount" inputMode="decimal" placeholder="Montant" required />
            <select className="field" name="currency" defaultValue="CDF">
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <input className="field" name="phone" type="tel" placeholder="Numéro mobile money qui reçoit" required />
          <button className="btn btn-block">Demander le retrait</button>
        </form>
        {sp.ok && <p className="notice notice-good">Demande envoyée. Le montant a été retiré de votre solde.</p>}
        {sp.erreur && <p className="msg-bad">{ERREURS[sp.erreur] ?? "Une erreur est survenue."}</p>}
        <p className="muted text-sm">
          L'équipe envoie l'argent sur ce numéro après vérification. Si la demande est refusée, le montant revient dans votre solde.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Mes retraits</h2>
        {payouts && payouts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {payouts.map((p) => {
              const st = PAYOUT_STATUS[p.status] ?? { label: p.status, badge: "pending" };
              return (
                <li key={p.id} className="card card-tight card-row">
                  <span>
                    {formatPrice(p.amount, p.currency)}
                    <span className="muted text-sm"> le {formatDate(p.created_at)}</span>
                  </span>
                  <span className={`badge badge-${st.badge}`}>{st.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Aucun retrait pour le moment.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2>Dernières ventes</h2>
        {sales && sales.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {sales.map((s) => (
              <li key={s.id} className="card card-tight card-row">
                <span>
                  {one(s.offers)?.name}
                  <span className="muted text-sm"> le {s.paid_at ? formatDate(s.paid_at) : ""}</span>
                </span>
                <span className="font-semibold">+{formatPrice(Number(s.amount) - Number(s.commission), s.currency)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aucune vente pour le moment.</p>
        )}
      </section>
    </main>
  );
}
