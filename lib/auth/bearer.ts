import { NextRequest } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiTokens, users, type User } from "@/lib/db/schema";
import { hashToken } from "./tokens";

export interface BearerAuth {
  user: User;
  tokenId: string;
}

/**
 * Verify the `Authorization: Bearer <token>` header against api_tokens.
 * Returns the owning user + token id on success, null on failure.
 * Updates last_used_at as a side-effect when the token resolves.
 */
export async function verifyBearer(req: NextRequest | Request): Promise<BearerAuth | null> {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const plaintext = m[1]!.trim();
  if (!plaintext) return null;

  const hash = hashToken(plaintext);
  const rows = await db
    .select({
      tokenId: apiTokens.id,
      userId: apiTokens.userId,
      revokedAt: apiTokens.revokedAt,
    })
    .from(apiTokens)
    .where(and(eq(apiTokens.hash, hash), isNull(apiTokens.revokedAt)))
    .limit(1);

  const tok = rows[0];
  if (!tok) return null;

  const userRows = await db.select().from(users).where(eq(users.id, tok.userId)).limit(1);
  const user = userRows[0];
  if (!user) return null;

  // Best-effort touch — fire and forget; don't fail the request if it errors.
  void db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, tok.tokenId))
    .catch(() => {});

  return { user, tokenId: tok.tokenId };
}
