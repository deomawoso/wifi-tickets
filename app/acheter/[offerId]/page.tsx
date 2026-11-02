import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatPrice, one } from "@/lib/format";
import { simulationEnabled } from "@/lib/payments";
import { startPurchase } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERREURS: Record<string, string> = {
  config: "Le service d'achat n'est pas encore configuré.",
  limite: "Trop de tentatives. Réessayez dans quelques minutes.",
  telephone: "Numéro invalide. Exemple : 0854452834 ou +243 85 445 2834.",
  trop: "Vous avez déjà plusieurs réservations en attente. Réessayez dans quelques minutes.",
  stock: "Désolé, cette offre vient d'être épuisée.",
  indisponible: "Cette offre n'est plus disponible.",
};

export default async function AcheterPage({
  params,
  searchParams,
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { offerId } = await params;
  const { erreur } = await searchParams;
  if (!UUID.test(offerId)) notFound();

  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("id, name, duration_minutes, price, currency, zones(id, name, city, district, status)")
    .eq("id", offerId)
    .eq("active", true)
    .maybeSingle();

  const zone = one(offer?.zones);
  if (!offer || !zone || zone.status !== "active") notFound();

  return (
    <main className="page page-narrow page-center">
      <Link href={`/zones/${zone.id}`} className="link text-sm">
        ← {zone.name}
      </Link>

      <div className="card">
        <p >{offer.name}</p>
        <p className="muted">
          {zone.name}, {zone.city}
          {zone.district ? `, ${zone.district}` : ""}
        </p>
        <p className="mt-2">
          {formatDuration(offer.duration_minutes)} ·{" "}
          <span className="font-semibold">
            {formatPrice(offer.price, offer.currency)}
          </span>
        </p>
      </div>

      {simulationEnabled() && (
        <p className="notice notice-warn">
          Mode simulation : aucun vrai paiement n'est effectué.
        </p>
      )}

      <form action={startPurchase} className="flex flex-col gap-3">
        <input type="hidden" name="offer_id" value={offer.id} />
        <label className="text-sm muted" htmlFor="phone">
          Votre numéro mobile money
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="Ex. 085 445 2834"
          className="field"
          required
        />
        <button className="btn btn-block">
          Réserver mon ticket
        </button>
      </form>

      {erreur && (
        <p className="msg-bad">
          {ERREURS[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      <p className="text-sm muted">
        Le ticket est réservé pour vous pendant 10 minutes.
      </p>
    </main>
  );
}
