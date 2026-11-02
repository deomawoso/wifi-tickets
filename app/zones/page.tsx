import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ZonesPage() {
  const supabase = await createClient();

  // La règle RLS ne laisse voir au public que les zones actives
  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, city, district")
    .eq("status", "active")
    .order("city", { ascending: true })
    .order("name", { ascending: true });

  return (
    <main className="page">
      <h1>Zones Wi-Fi</h1>

      {zones && zones.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {zones.map((z) => (
            <li key={z.id}>
              <Link
                href={`/zones/${z.id}`}
                className="card card-link"
              >
                <p className="font-medium">{z.name}</p>
                <p className="text-sm muted">
                  {z.city}
                  {z.district ? `, ${z.district}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Aucune zone disponible pour le moment.
        </p>
      )}
    </main>
  );
}
