export const ZONE_STATUS: Record<string, string> = {
  pending: "En attente de validation",
  active: "Active",
  suspended: "Suspendue",
};

export function formatDuration(minutes: number): string {
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return `${d} jour${d > 1 ? "s" : ""}`;
  }
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
}

export function formatPrice(price: number | string, currency: string): string {
  return `${Number(price).toLocaleString("fr-FR")} ${currency}`;
}

export const DURATIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 heure" },
  { minutes: 120, label: "2 heures" },
  { minutes: 180, label: "3 heures" },
  { minutes: 360, label: "6 heures" },
  { minutes: 720, label: "12 heures" },
  { minutes: 1440, label: "1 jour" },
  { minutes: 2880, label: "2 jours" },
  { minutes: 10080, label: "7 jours" },
  { minutes: 43200, label: "30 jours" },
];

// Une jointure Supabase renvoie parfois un objet, parfois un tableau d'un élément
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Kinshasa",
  });
}

export const PAYOUT_STATUS: Record<string, { label: string; badge: string }> = {
  requested: { label: "En attente", badge: "pending" },
  paid: { label: "Payé", badge: "active" },
  rejected: { label: "Refusé", badge: "suspended" },
};
