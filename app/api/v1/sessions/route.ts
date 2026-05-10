import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { verifyBearer } from "@/lib/auth/bearer";
import { parsePath } from "@/lib/sessions/parse-path";

export const runtime = "nodejs";
// Bodies can be a few hundred KB; runtime is node so we can read the full body.
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_048_576; // 1 MB hard cap, per spec

/**
 * POST /api/v1/sessions
 *
 * The endpoint the Python archiver hits. Contract — must match
 * `_backend_vercel` in ~/.claude/haunt/archive.py:
 *
 *   Authorization: Bearer <token>
 *   Content-Type:  application/json
 *   { "path": "<rel/path.md>", "content": "<markdown body>" }
 */
export async function POST(req: NextRequest) {
  const auth = await verifyBearer(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 401 },
    );
  }

  // Parse + validate body. Reading as text lets us check size before JSON-parsing.
  const raw = await req.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  let payload: { path?: unknown; content?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const path = typeof payload.path === "string" ? payload.path.trim() : "";
  const content = typeof payload.content === "string" ? payload.content : "";
  if (!path || !content) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", detail: "path and content are required" },
      { status: 400 },
    );
  }

  const parsed = parsePath(path);
  // Project name = last path segment between session date and slug if present;
  // archiver currently doesn't ship project — leave null and let UI fall back.
  const project = extractProject(content) ?? null;

  // Upload markdown to Vercel Blob first; then write metadata. If the metadata
  // insert fails, we'd orphan the blob — acceptable for now (cheap, tiny).
  const blobKey = `sessions/${auth.user.id}/${parsed.sessionDate}/${parsed.slug}-${Date.now()}.md`;
  // Key includes a Date.now() suffix so two uploads of the same file are
  // distinct blobs — no overwrite, no collisions.
  const { url } = await put(blobKey, content, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });

  const [row] = await db
    .insert(sessions)
    .values({
      userId: auth.user.id,
      source: parsed.source,
      slug: parsed.slug,
      title: parsed.title,
      project,
      sessionDate: parsed.sessionDate,
      blobUrl: url,
      byteSize: Buffer.byteLength(content, "utf8"),
    })
    .returning({ id: sessions.id });

  return NextResponse.json(
    { ok: true, id: row!.id, url: `/app/sessions/${row!.id}` },
    { status: 201 },
  );
}

// Best-effort project extraction from the rendered markdown front matter:
//   - **Project:** `company` — `/path/to/dir`
function extractProject(md: string): string | null {
  const m = md.match(/\*\*Project:\*\*\s*`([^`]+)`/);
  return m ? m[1]!.trim() : null;
}
