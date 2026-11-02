"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { cryptoReady, encryptCode, hashCode } from "@/lib/crypto";
import { parseCodes } from "@/lib/tickets";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createZone(formData: FormData) {
  const { supabase, user } = await requireRole(["manager", "admin"]);

  const name = text(formData, "name");
  const city = text(formData, "city");
  const district = text(formData, "district");
  const description = text(formData, "description");

  if (!name || !city) redirect("/gerant?erreur=champs");

  // Le statut n'est pas envoyé : la base le met toujours à « pending »
  const { error } = await supabase.from("zones").insert({
    manager_id: user.id,
    name,
    city,
    district: district || null,
    description: description || null,
  });

  if (error) redirect("/gerant?erreur=creation");

  revalidatePath("/gerant");
  redirect("/gerant");
}

export async function createOffer(formData: FormData) {
  const { supabase } = await requireRole(["manager", "admin"]);

  const zoneId = text(formData, "zone_id");
  const name = text(formData, "name");
  const minutes = Number(text(formData, "duration_minutes"));
  const price = Number(text(formData, "price"));
  const currency = text(formData, "currency");

  if (!UUID.test(zoneId)) redirect("/gerant");

  const base = `/gerant/zones/${zoneId}`;
  if (
    !name ||
    !Number.isInteger(minutes) ||
    minutes <= 0 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !["CDF", "USD"].includes(currency)
  ) {
    redirect(`${base}?erreur=champs`);
  }

  // La règle RLS refuse l'insertion si la zone n'appartient pas à l'utilisateur
  const { error } = await supabase.from("offers").insert({
    zone_id: zoneId,
    name,
    duration_minutes: minutes,
    price,
    currency,
  });

  if (error) redirect(`${base}?erreur=creation`);

  revalidatePath(base);
  redirect(base);
}

export async function importTickets(formData: FormData) {
  const { supabase } = await requireRole(["manager", "admin"]);

  const zoneId = text(formData, "zone_id");
  const offerId = text(formData, "offer_id");
  if (!UUID.test(zoneId) || !UUID.test(offerId)) redirect("/gerant");

  const base = `/gerant/zones/${zoneId}`;
  if (!cryptoReady()) redirect(`${base}?erreur=cle`);

  // Codes collés dans la zone de texte et/ou fichier envoyé
  let raw = String(formData.get("codes") ?? "");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 500_000) redirect(`${base}?erreur=fichier`);
    raw += "\n" + (await file.text());
  }

  const { codes, invalid, duplicatesInFile } = parseCodes(raw);
  if (codes.length === 0) redirect(`${base}?erreur=vide`);
  if (codes.length > 5000) redirect(`${base}?erreur=trop`);

  let inserted = 0;
  let duplicatesInDb = 0;

  for (let i = 0; i < codes.length; i += 1000) {
    const chunk = codes.slice(i, i + 1000).map((c) => ({
      c: encryptCode(c),
      h: hashCode(c),
    }));

    // La fonction SQL vérifie que l'offre appartient bien à ce gérant
    const { data, error } = await supabase.rpc("import_tickets", {
      p_offer_id: offerId,
      p_codes: chunk,
    });
    if (error) redirect(`${base}?erreur=import`);

    inserted += Number(data.inserted);
    duplicatesInDb += Number(data.duplicates);
  }

  revalidatePath(base);
  redirect(
    `${base}?importes=${inserted}&doublons=${duplicatesInFile + duplicatesInDb}&invalides=${invalid}`
  );
}
