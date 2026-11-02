import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { setUserRole } from "../actions";

const ROLES: Record<string, string> = { client: "Client", manager: "Gérant", admin: "Admin" };

export default async function UtilisateursPage() {
  const { supabase, user } = await requireRole(["admin"]);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="page">
      <Link href="/admin" className="link text-sm">← Administration</Link>
      <h1>Utilisateurs</h1>

      <ul className="flex flex-col gap-3">
        {users?.map((u) => (
          <li key={u.id} className="card card-row">
            <div>
              <p className="font-semibold">{u.full_name || "Sans nom"}</p>
              <p className="muted text-sm">{u.phone}, {ROLES[u.role] ?? u.role}</p>
            </div>
            {u.id !== user.id && u.role !== "admin" && (
              <form action={setUserRole}>
                <input type="hidden" name="user_id" value={u.id} />
                <input type="hidden" name="role" value={u.role === "manager" ? "client" : "manager"} />
                <button className="btn btn-ghost btn-sm">
                  {u.role === "manager" ? "Repasser client" : "Passer gérant"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
