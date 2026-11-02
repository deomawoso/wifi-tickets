"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["pending", "active", "suspended"];

export async function setZoneStatus(formData: FormData) {
  const { supabase } = await requireRole(["admin"]);

  const zoneId = String(formData.get("zone_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID.test(zoneId) || !STATUSES.includes(status)) return;

  // La fonction SQL vérifie elle aussi que l'appelant est admin
  await supabase.rpc("admin_set_zone_status", {
    p_zone_id: zoneId,
    p_status: status,
  });

  revalidatePath("/admin");
}

export async function processPayout(formData: FormData) {
  const { supabase } = await requireRole(["admin"]);
  const id = String(formData.get("payout_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID.test(id) || !["paid", "rejected"].includes(status)) return;

  await supabase.rpc("admin_process_payout", { p_payout_id: id, p_status: status });
  revalidatePath("/admin/retraits");
}

export async function setUserRole(formData: FormData) {
  const { supabase } = await requireRole(["admin"]);
  const id = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!UUID.test(id) || !["client", "manager"].includes(role)) return;

  await supabase.rpc("admin_set_role", { p_user_id: id, p_role: role });
  revalidatePath("/admin/utilisateurs");
}
