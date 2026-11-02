export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Cette adresse e-mail est déjà utilisée.";
  if (m.includes("password") && (m.includes("least") || m.includes("weak")))
    return "Mot de passe trop faible : utilisez au moins 8 caractères.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (m.includes("invalid") && m.includes("email"))
    return "Adresse e-mail invalide.";
  return "L'inscription a échoué. Vérifiez vos informations et réessayez.";
}
