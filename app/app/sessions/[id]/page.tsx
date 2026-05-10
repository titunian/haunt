import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import FrontmatterCard from "./FrontmatterCard";
import SessionMarkdown from "./SessionMarkdown";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1);

  if (!row) notFound();

  // Server-side fetch — keeps the blob URL out of the client tree.
  const blobRes = await fetch(row.blobUrl, { cache: "no-store" });
  const raw = blobRes.ok ? await blobRes.text() : "Failed to load content.";
  const body = stripLeadingMetadata(raw);

  return (
    <article className="session-page">
      <Link href="/app" className="session-back" aria-label="Back to sessions">
        ← back to sessions
      </Link>

      <FrontmatterCard
        title={row.title}
        source={row.source}
        sessionDate={row.sessionDate as unknown as string}
        project={row.project}
        byteSize={row.byteSize}
        slug={row.slug}
        createdAt={row.createdAt}
      />

      <SessionMarkdown body={body} />
    </article>
  );
}

/**
 * Strip the metadata header the Python renderer emits so we don't render it
 * twice (FrontmatterCard already shows it from the DB).
 *
 * Format:
 *   # <title>
 *
 *   - **When:** ...
 *   - **Project:** ...
 *   - ...
 *
 *   ---
 *
 *   ### User · ...
 *
 * We split on the first standalone `---` divider; everything after is the
 * conversation body. If no divider is found (older format / corrupt file),
 * fall back to the original content so nothing's lost.
 */
function stripLeadingMetadata(content: string): string {
  const lines = content.split("\n");
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    if (lines[i].trim() === "---") {
      return lines.slice(i + 1).join("\n").trimStart();
    }
  }
  return content;
}
