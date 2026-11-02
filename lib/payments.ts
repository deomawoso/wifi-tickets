// La simulation de paiement n'est JAMAIS active en production,
// même si la variable est définie par erreur.
export function simulationEnabled(): boolean {
  return (
    process.env.PAYMENT_SIMULATION === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
