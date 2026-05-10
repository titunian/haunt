"use server";

// Server actions for the dashboard: token lifecycle, account / data ops.
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, isNull } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens, sessions, users } from "@/lib/db/schema";
import { generateToken } from "@/lib/auth/tokens";

// Name of the one-shot cookie used to surface a freshly-minted token to the
// dashboard. httpOnly + short TTL — never appears in URL, history, or Referer.
const FRESH_TOKEN_COOKIE = "haunt_fresh_token";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new Error("not_authenticated");
  return id;
}

/**
 * Generate a fresh API token for the signed-in user. Revokes any existing
 * non-revoked tokens (one active token at a time, by design — keeps the user
 * config story simple). Plaintext is handed to the next render via a one-shot
 * httpOnly cookie so it never lands in URL, history, or Referer.
 */
export async function generateApiToken() {
  const userId = await requireUserId();

  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)));

  const { plaintext, hash, suffix } = generateToken();
  await db.insert(apiTokens).values({ userId, hash, suffix });

  const jar = await cookies();
  jar.set(FRESH_TOKEN_COOKIE, plaintext, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/app",
    maxAge: 60,           // single render window
  });

  revalidatePath("/app");
  redirect("/app");
}

/** Revoke the active token without minting a new one. */
export async function revokeApiToken() {
  const userId = await requireUserId();
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)));
  revalidatePath("/app");
}

/**
 * Hard-delete the user: cascade removes accounts, auth_sessions, api_tokens,
 * and session metadata. Blob bodies are best-effort cleaned up beforehand.
 */
export async function deleteAccount() {
  const userId = await requireUserId();

  const rows = await db
    .select({ blobUrl: sessions.blobUrl })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  await Promise.all(rows.map((r) => del(r.blobUrl).catch(() => {})));

  await db.delete(users).where(eq(users.id, userId));
  await signOut({ redirect: false });
  redirect("/");
}

/**
 * Build a JSON export of the user's session metadata for download.
 * Used by /app/settings export action — returns the JSON string.
 */
export async function exportData(): Promise<string> {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId));
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      sessions: rows.map((r) => ({
        id: r.id,
        source: r.source,
        slug: r.slug,
        title: r.title,
        project: r.project,
        session_date: r.sessionDate,
        blob_url: r.blobUrl,
        byte_size: r.byteSize,
        created_at: r.createdAt,
      })),
    },
    null,
    2,
  );
}
