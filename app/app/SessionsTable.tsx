import Link from "next/link";
import SourceIcon from "@/components/SourceIcon";

interface Row {
  id: string;
  source: string;
  title: string;
  project: string | null;
  sessionDate: string;   // YYYY-MM-DD (when the session happened)
  createdAt: string;     // ISO (when uploaded)
  byteSize: number;
}

interface Group {
  label: string;
  rows: Row[];
}

export default function SessionsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;

  const groups = groupByRecency(rows);

  return (
    <div className="session-list" role="list">
      {groups.map((g) => (
        <section key={g.label} className="session-group">
          <header className="session-group-header">
            <span className="session-group-label">{g.label}</span>
            <span className="session-group-count">
              {g.rows.length}
              <span className="session-group-count-noun">
                {g.rows.length === 1 ? " session" : " sessions"}
              </span>
            </span>
          </header>

          <ul className="session-rows">
            {g.rows.map((r) => (
              <li key={r.id} className="session-row" role="listitem">
                <Link
                  href={`/app/sessions/${r.id}`}
                  className="session-row-link"
                  aria-label={`Open ${r.title}`}
                >
                  <span className="session-row-time" title={fullTime(r.createdAt)}>
                    {dayTime(r.sessionDate, r.createdAt)}
                  </span>
                  <span
                    className={`session-row-src src-${r.source}`}
                    aria-label={`Source: ${r.source}`}
                  >
                    <SourceIcon source={r.source} size={10} />
                    {r.source}
                  </span>
                  <span className="session-row-project" title={r.project ?? ""}>
                    {r.project ?? "—"}
                  </span>
                  <span className="session-row-title">{r.title}</span>
                  <span className="session-row-size">{formatBytes(r.byteSize)}</span>
                  <span className="session-row-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------- grouping ----------------------------------------------------- */

function groupByRecency(rows: Row[]): Group[] {
  // sessionDate is the local date the session happened. Bucket using "now".
  const today = isoDay(new Date());
  const yesterday = isoDay(addDays(new Date(), -1));
  const sevenDaysAgo = isoDay(addDays(new Date(), -7));
  const thirtyDaysAgo = isoDay(addDays(new Date(), -30));

  const buckets: Record<string, Row[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    "This month": [],
    Earlier: [],
  };

  for (const r of rows) {
    const d = r.sessionDate;
    if (d === today) buckets.Today.push(r);
    else if (d === yesterday) buckets.Yesterday.push(r);
    else if (d >= sevenDaysAgo) buckets["This week"].push(r);
    else if (d >= thirtyDaysAgo) buckets["This month"].push(r);
    else buckets.Earlier.push(r);
  }

  return Object.entries(buckets)
    .filter(([, rows]) => rows.length > 0)
    .map(([label, rows]) => ({ label, rows }));
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* ---------- formatting --------------------------------------------------- */

function dayTime(sessionDate: string, createdAt: string): string {
  // For Today / Yesterday rows, show HH:MM. For older rows, show short date.
  const today = isoDay(new Date());
  const yesterday = isoDay(addDays(new Date(), -1));
  if (sessionDate === today || sessionDate === yesterday) {
    const d = new Date(createdAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  // e.g., "Apr 26"
  const d = new Date(sessionDate + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fullTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}K`;
  return `${(n / (1024 * 1024)).toFixed(1)}M`;
}
