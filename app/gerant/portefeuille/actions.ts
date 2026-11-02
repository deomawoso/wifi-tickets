"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { normalizeCongoPhone } from "@/lib/phone";

const BASE = "/gerant/portefeuille";

export async function requestPayout(formData: FormData) {
  const { supabase } = await requireRole(["manager", "admin"]);

  const raw = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const amount = Math.round(raw * 100) / 100;
  const currency = String(formData.get("currency") ?? "");
  const phone = normalizeCongoPhone(String(formData.get("phone") ?? ""));

  if (!Number.isFinite(amount) || amount <= 0 || !["CDF", "USD"].includes(currency)) {
    redirect(`${BASE}?erreur=montant`);
  }
  if (!phone) redirect(`${BASE}?erreur=telephone`);

  const { error } = await supabase.rpc("request_payout", {
    p_amount: amount,
    p_currency: currency,
    p_phone: phone,
  });
  if (error) {
    redirect(`${BASE}?erreur=${error.message.includes("insufficient_funds") ? "solde" : "echec"}`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?ok=1`);
}
