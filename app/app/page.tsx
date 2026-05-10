import { cookies } from "next/headers";
import { eq, and, isNull, desc, sql, gte, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens, sessions } from "@/lib/db/schema";
import { generateToken } from "@/lib/auth/tokens";
import GhostMark from "@/components/GhostMark";
import ConnectCard from "./ConnectCard";
import SessionsTable from "./SessionsTable";
import FilterBar from "./FilterBar";
import LiveSync from "./LiveSync";

export const dynamic = "force-dynamic";

const FRESH_TOKEN_COOKIE = "haunt_fresh_token";

type Filters = {
  source: string | null;
  project: string | null;
  q: string | null;
  range: "7d" | "30d" | "all";
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    source?: string;
    project?: string;
    q?: string;
    range?: string;
  }>;
}) {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const jar = await cookies();
  const freshCookie = jar.get(FRESH_TOKEN_COOKIE);
  const fresh = freshCookie?.value ?? null;
  if (freshCookie) jar.delete(FRESH_TOKEN_COOKIE);

  const params = await searchParams;
  const filters: Filters = {
    source:
      params.source && ["claude", "codex", "cursor"].includes(params.source)
        ? params.source
        : null,
    project: params.project?.trim() || null,
    q: params.q?.trim() || null,
    range:
      params.range === "7d" || params.range === "30d" ? params.range : "all",
  };

  // Auto-mint token on first visit so the connect command is ready to copy.
  const tokenRows = await db
    .select({ id: apiTokens.id, createdAt: apiTokens.createdAt })
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)))
    .orderBy(desc(apiTokens.createdAt))
    .limit(1);

  let setupPlaintext: string | null = fresh;
  const hadExistingToken = tokenRows.length > 0;
  if (!hadExistingToken && !setupPlaintext) {
    const minted = generateToken();
    await db
      .insert(apiTokens)
      .values({ userId, hash: minted.hash, suffix: minted.suffix });
    setupPlaintext = minted.plaintext;
  }

  // Stats — always over the user's full set, unfiltered.
  const statsRows = await db
    .select({
      total: sql<number>`count(*)::int`,
      days: sql<number>`count(distinct ${sessions.sessionDate})::int`,
      bytes: sql<number>`coalesce(sum(${sessions.byteSize}), 0)::bigint`,
      lastUpload: sql<string | null>`max(${sessions.createdAt})`,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const stats =
    statsRows[0] ?? { total: 0, days: 0, bytes: 0, lastUpload: null };
  // Drizzle gives us either a Date or a stringy timestamp depending on
  // adapter; coerce to ISO once here so the client component is simple.
  const lu = stats.lastUpload as Date | string | null;
  const lastUploadIso =
    lu == null ? null : typeof lu === "string" ? lu : lu.toISOString();

  // Distinct projects so the dropdown can offer real choices.
  const projectRows = await db
    .selectDistinct({ project: sessions.project })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), sql`${sessions.project} is not null`))
    .orderBy(sessions.project);
  const projectOptions = projectRows
    .map((r) => r.project)
    .filter((p): p is string => Boolean(p));

  // Build the WHERE clause from filters.
  const conditions = [eq(sessions.userId, userId)];
  if (filters.source) conditions.push(eq(sessions.source, filters.source));
  if (filters.project) conditions.push(eq(sessions.project, filters.project));
  if (filters.q) conditions.push(ilike(sessions.title, `%${filters.q}%`));
  if (filters.range !== "all") {
    const days = filters.range === "7d" ? 7 : 30;
    conditions.push(
      gte(
        sessions.sessionDate,
        sql`(current_date - ${sql.raw(`interval '${days} days'`)})`,
      ),
    );
  }
  const whereClause = and(...conditions);

  // Order by when the session actually happened, not when it was uploaded.
  // createdAt is a deterministic tiebreaker for sessions on the same date.
  const recent = await db
    .select({
      id: sessions.id,
      source: sessions.source,
      title: sessions.title,
      project: sessions.project,
      sessionDate: sessions.sessionDate,
      createdAt: sessions.createdAt,
      byteSize: sessions.byteSize,
    })
    .from(sessions)
    .where(whereClause)
    .orderBy(desc(sessions.sessionDate), desc(sessions.createdAt))
    .limit(50);

  // Total matching the active filters — for the "X of Y" pill.
  const matchedRows = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sessions)
    .where(whereClause);
  const matchedTotal = matchedRows[0]?.total ?? 0;

  const isFiltered =
    filters.source || filters.project || filters.q || filters.range !== "all";

  return (
    <>
      <ConnectCard
        plaintext={setupPlaintext}
        hasExistingToken={hadExistingToken}
        userHasSessions={stats.total > 0}
      />

      {stats.total > 0 && (
        <div className="dash-summary">
          <LiveSync lastUploadIso={lastUploadIso} />
          <span className="dash-summary-sep">·</span>
          <span className="dash-summary-num">{stats.total.toLocaleString()}</span>
          <span className="dash-summary-noun">sessions</span>
          <span className="dash-summary-sep">·</span>
          <span className="dash-summary-num">{stats.days}</span>
          <span className="dash-summary-noun">days</span>
          <span className="dash-summary-sep">·</span>
          <span className="dash-summary-num">{formatBytes(Number(stats.bytes))}</span>
          <span className="dash-summary-noun">stored</span>
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Sessions</h2>
          <span className="label">
            {isFiltered
              ? `${matchedTotal.toLocaleString()} match · ${stats.total.toLocaleString()} total`
              : `${recent.length} of ${stats.total.toLocaleString()}`}
          </span>
        </div>

        <FilterBar filters={filters} projectOptions={projectOptions} />

        {recent.length === 0 ? (
          <div className="empty-state">
            <GhostMark size={56} className="ghost-big" />
            {isFiltered ? (
              <>No sessions match these filters.</>
            ) : (
              <>
                No sessions yet. Run the setup command above and your archive will
                start streaming in.
              </>
            )}
          </div>
        ) : (
          <SessionsTable
            rows={recent.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
              sessionDate: String(r.sessionDate),
            }))}
          />
        )}
      </section>
    </>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
