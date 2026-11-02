export type ParseResult = {
  codes: string[];
  invalid: number;
  duplicatesInFile: number;
};

// Lit un texte avec un code par ligne (CSV ou TXT).
// Si une ligne contient plusieurs colonnes, seule la première est utilisée.
export function parseCodes(raw: string): ParseResult {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  const seen = new Set<string>();
  const codes: string[] = [];
  let invalid = 0;
  let duplicatesInFile = 0;
  let first = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const value = trimmed
      .split(/[,;\t]/)[0]
      .trim()
      .replace(/^["']|["']$/g, "");

    // Ignore une ligne d'en-tête éventuelle
    if (first) {
      first = false;
      if (/^(code|codes|ticket|tickets|voucher|pin)$/i.test(value)) continue;
    }

    if (!/^[A-Za-z0-9._-]{3,64}$/.test(value)) {
      invalid++;
      continue;
    }
    if (seen.has(value)) {
      duplicatesInFile++;
      continue;
    }
    seen.add(value);
    codes.push(value);
  }

  return { codes, invalid, duplicatesInFile };
}
