// Normalise un numéro congolais en "243XXXXXXXXX" (9 chiffres commençant par 8 ou 9).
// Accepte : +243 85 445 2834, 0854452834, 854452834...
export function normalizeCongoPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let national: string;

  if (digits.startsWith("243") && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!/^[89]\d{8}$/.test(national)) return null;
  return "243" + national;
}
