import { createHash, randomBytes } from "node:crypto";

// Token format: `hnt_<43 chars of url-safe base64>` — total ~47 chars.
// Prefix lets us recognize it in logs / config files at a glance.
export const TOKEN_PREFIX = "hnt_";

export function generateToken(): { plaintext: string; hash: string; suffix: string } {
  const raw = randomBytes(32).toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${raw}`;
  const hash = hashToken(plaintext);
  const suffix = plaintext.slice(-4);
  return { plaintext, hash, suffix };
}

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function maskToken(suffix: string): string {
  return `${TOKEN_PREFIX}${"•".repeat(16)}${suffix}`;
}
