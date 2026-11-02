"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { adminReady, createAdminClient } from "@/lib/supabase/admin";
import { normalizeCongoPhone } from "@/lib/phone";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nombre maximum de réservations en attente par numéro (anti-abus)
const MAX_PENDING_PER_PHONE = 3;

export async function startPurchase(formData: FormData) {
  const offerId = String(formData.get("offer_id") ?? "");
  if (!UUID.test(offerId)) redirect("/zones");

  const base = `/acheter/${offerId}`;
  if (!adminReady()) redirect(`${base}?erreur=config`);

  const phone = normalizeCongoPhone(String(formData.get("phone") ?? ""));
  if (!phone) redirect(`${base}?erreur=telephone`);

  const admin = createAdminClient();

  // Libère les réservations expirées avant de chercher un ticket
  await admin.rpc("release_expired_reservations");

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", phone)
    .eq("status", "pending");
  if ((count ?? 0) >= MAX_PENDING_PER_PHONE) redirect(`${base}?erreur=trop`);

  // Limite par adresse IP : 10 réservations par tranche de 10 minutes
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (ip) {
    const { data: allowed } = await admin.rpc("check_rate_limit", {
      p_key: `achat:${ip}`,
      p_max: 10,
      p_window_seconds: 600,
    });
    if (allowed === false) redirect(`${base}?erreur=limite`);
  }

  // Réserve un ticket (verrou en base : jamais deux fois le même code)
  const { data: orderId, error } = await admin.rpc("reserve_ticket", {
    p_offer_id: offerId,
    p_customer_phone: phone,
  });

  if (error || !orderId) {
    const stock = error?.message?.includes("out_of_stock");
    redirect(`${base}?erreur=${stock ? "stock" : "indisponible"}`);
  }

  // Si le client est connecté, on lie la commande à son compte (pour « Mes commandes »)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await admin.from("orders").update({ user_id: user.id }).eq("id", orderId);
  }

  redirect(`/commande/${orderId}`);
}
