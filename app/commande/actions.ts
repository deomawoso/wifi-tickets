"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { adminReady, createAdminClient } from "@/lib/supabase/admin";
import { simulationEnabled } from "@/lib/payments";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Simule la confirmation d'un paiement. Désactivé en production.
export async function simulatePayment(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  if (!UUID.test(orderId)) redirect("/zones");

  const base = `/commande/${orderId}`;
  if (!simulationEnabled() || !adminReady()) redirect(base);

  const admin = createAdminClient();
  const { error } = await admin.rpc("confirm_payment", {
    p_order_id: orderId,
    p_provider_ref: `SIM-${randomUUID()}`,
  });

  redirect(error ? `${base}?erreur=paiement` : base);
}
