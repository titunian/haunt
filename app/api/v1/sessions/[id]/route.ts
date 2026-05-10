import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { verifyBearer } from "@/lib/auth/bearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/sessions/:id
// Returns metadata + full markdown content, owner-scoped via bearer token.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyBearer(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // Pull the markdown body straight from blob.
  const blob = await fetch(row.blobUrl).catch(() => null);
  const content = blob && blob.ok ? await blob.text() : "";

  return NextResponse.json({
    ok: true,
    session: {
      id: row.id,
      source: row.source,
      slug: row.slug,
      title: row.title,
      project: row.project,
      session_date: row.sessionDate,
      byte_size: row.byteSize,
      created_at: row.createdAt,
      content,
    },
  });
}

// DELETE /api/v1/sessions/:id — removes metadata + blob.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyBearer(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select({ blobUrl: sessions.blobUrl })
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await db
    .delete(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)));

  // Best-effort blob cleanup
  await del(row.blobUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
