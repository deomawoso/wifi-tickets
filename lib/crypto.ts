import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

// Clé de 32 octets (64 caractères hexadécimaux) stockée uniquement sur le serveur.
// Si elle est perdue, les tickets chiffrés deviennent illisibles.
function getKey(): Buffer {
  const hex = process.env.TICKETS_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("TICKETS_ENCRYPTION_KEY manquante ou invalide");
  }
  return Buffer.from(hex, "hex");
}

export function cryptoReady(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

// Chiffrement AES-256-GCM : "iv.tag.donnees" en base64
export function encryptCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64")).join(".");
}

// Servira plus tard pour afficher le code à l'acheteur (côté serveur uniquement)
export function decryptCode(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// Empreinte pour détecter les doublons sans stocker le code en clair
export function hashCode(code: string): string {
  return createHmac("sha256", getKey()).update(`ticket:${code}`).digest("hex");
}
