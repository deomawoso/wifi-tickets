import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { formatPrice, one } from "@/lib/format";

const ORDER_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: "En attente", badge: "pending" },
  paid: { label: "Payée", badge: "active" },
  delivered: { label: "Payée", badge: "active" },
  failed: { label: "Expirée", badge: "suspended" },
  refunded: { label: "Remboursée", badge: "suspended" },
};

export default async function ComptePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount, currency, offers(name, zones(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const isManager = profile?.role === "manager" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";

  return (
    <main className="page page-narrow page-center">
      <h1>Mon compte</h1>

      <div className="card">
        <p>
          <span className="muted">Nom :</span> {profile?.full_name}
        </p>
        <p>
          <span className="muted">Téléphone :</span> {profile?.phone}
        </p>
        <p>
          <span className="muted">E-mail :</span> {user.email}
        </p>
        <p>
          <span className="muted">Rôle :</span> {profile?.role}
        </p>
      </div>

      {(isManager || isAdmin) && (
        <div className="flex flex-wrap gap-3">
          {isManager && (
            <Link
              href="/gerant"
              className="btn"
            >
              Espace gérant
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="btn"
            >
              Administration
            </Link>
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2>Mes commandes</h2>
        {orders && orders.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {orders.map((o) => {
              const offer = one(o.offers);
              const st = ORDER_STATUS[o.status] ?? { label: o.status, badge: "pending" };
              return (
                <li key={o.id}>
                  <Link href={`/commande/${o.id}`} className="card card-link card-row">
                    <span>
                      <span className="font-semibold">{offer?.name}</span>
                      <span className="muted text-sm block">{one(offer?.zones)?.name}</span>
                    </span>
                    <span className="text-right">
                      <span className="block">{formatPrice(o.amount, o.currency)}</span>
                      <span className={`badge badge-${st.badge}`}>{st.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Aucune commande liée à votre compte pour le moment.</p>
        )}
      </section>

      <form action={signOut}>
        <button className="btn btn-ghost">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
