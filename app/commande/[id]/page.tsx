import Link from "next/link";
import { notFound } from "next/navigation";
import { adminReady, createAdminClient } from "@/lib/supabase/admin";
import { decryptCode } from "@/lib/crypto";
import { simulationEnabled } from "@/lib/payments";
import { formatDuration, formatPrice, one } from "@/lib/format";
import { simulatePayment } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  if (!UUID.test(id) || !adminReady()) notFound();

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, amount, currency, reserved_until, ticket_id, offer_id, offers(name, duration_minutes, zones(name, city, district))"
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const offer = one(order.offers);
  const zone = one(offer?.zones);

  const isPaid = order.status === "paid" || order.status === "delivered";
  const expired =
    order.status === "failed" ||
    (order.status === "pending" &&
      new Date(order.reserved_until).getTime() < Date.now());

  // Le code n'est déchiffré que pour une commande payée, côté serveur
  let code: string | null = null;
  if (isPaid) {
    const { data: ticket } = await admin
      .from("tickets")
      .select("code_encrypted")
      .eq("id", order.ticket_id)
      .single();
    try {
      code = ticket ? decryptCode(ticket.code_encrypted) : null;
    } catch {
      code = null;
    }
  }

  const until = new Date(order.reserved_until).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Kinshasa",
  });

  return (
    <main className="page page-narrow page-center">
      <h1>Votre commande</h1>

      <div className="card">
        <p className="font-semibold">{offer?.name}</p>
        <p className="muted">
          {zone?.name}, {zone?.city}
          {zone?.district ? `, ${zone.district}` : ""}
        </p>
        <p className="mt-2">
          {offer ? formatDuration(offer.duration_minutes) : ""} ·{" "}
          <span className="font-semibold">
            {formatPrice(order.amount, order.currency)}
          </span>
        </p>
      </div>

      {isPaid && (
        <div className="card voucher">
          <p className="text-sm good-text">Paiement confirmé. Votre code :</p>
          {code ? (
            <p className="voucher-code select-all">
              {code}
            </p>
          ) : (
            <p className="mt-2 msg-bad">
              Le code n'a pas pu être affiché. Contactez le support avec ce
              numéro de commande : {order.id}
            </p>
          )}
          <p className="mt-3 text-sm muted">
            Notez ce code ou faites une capture d'écran. Gardez cette page.
          </p>
        </div>
      )}

      {order.status === "pending" && !expired && (
        <div className="flex flex-col gap-3">
          <p>
            Ticket réservé jusqu'à <span className="font-semibold">{until}</span>.
          </p>
          {simulationEnabled() ? (
            <form action={simulatePayment}>
              <input type="hidden" name="order_id" value={order.id} />
              <button className="btn btn-block">
                Simuler le paiement
              </button>
              <p className="mt-2 text-sm warn-text">
                Mode simulation : aucun vrai paiement n'est effectué.
              </p>
            </form>
          ) : (
            <p className="muted">
              Le paiement mobile money sera bientôt disponible.
            </p>
          )}
        </div>
      )}

      {expired && !isPaid && (
        <div className="flex flex-col gap-3">
          <p className="msg-bad">
            Cette réservation a expiré. Le ticket a été remis en vente.
          </p>
          <Link
            href={`/acheter/${order.offer_id}`}
            className="btn btn-block"
          >
            Recommencer
          </Link>
        </div>
      )}

      {erreur === "paiement" && (
        <p className="msg-bad">
          Le paiement n'a pas pu être confirmé. Si la réservation a expiré,
          recommencez.
        </p>
      )}
    </main>
  );
}
