// The Python archiver POSTs paths shaped like:
//   "2026-05-10/migration-review__a93f1c.md"
// or, in the multi-source future:
//   "claude/2026-05-10/migration-review__a93f1c.md"
//
// We extract: source, sessionDate (YYYY-MM-DD), slug, and a human title from
// the slug ("migration-review" → "Migration review"). The "__hash" suffix is
// dropped from the displayed title but kept in the slug.

const KNOWN_SOURCES = new Set(["claude", "codex", "cursor"]);

export interface ParsedPath {
  source: "claude" | "codex" | "cursor" | "unknown";
  sessionDate: string; // YYYY-MM-DD
  slug: string;
  title: string;
}

export function parsePath(rawPath: string): ParsedPath {
  // Normalize: strip leading slashes, drop .md
  const path = rawPath.replace(/^\/+/, "").replace(/\.md$/i, "");
  const parts = path.split("/").filter(Boolean);

  let source: ParsedPath["source"] = "claude";
  let dateStr = todayIso();
  let fileBase = parts[parts.length - 1] ?? "session";

  // Pattern A: <source>/<date>/<file>
  // Pattern B: <date>/<file>           (current archiver)
  // Pattern C: just <file>             (fallback)
  if (parts.length >= 3 && KNOWN_SOURCES.has(parts[0]!)) {
    source = parts[0] as ParsedPath["source"];
    dateStr = isIsoDate(parts[1]!) ? parts[1]! : todayIso();
    fileBase = parts[2]!;
  } else if (parts.length >= 2 && isIsoDate(parts[0]!)) {
    dateStr = parts[0]!;
    fileBase = parts[1]!;
  }

  // Some archivers prefix the filename with "claude__…"
  const m = fileBase.match(/^(claude|codex|cursor)__(.+)$/i);
  if (m) {
    source = m[1]!.toLowerCase() as ParsedPath["source"];
    fileBase = m[2]!;
  }

  const slug = fileBase;
  // Title: drop the "__abc123" hash suffix, replace dashes with spaces, sentence-case.
  const titleRaw = fileBase.replace(/__[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  const title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1) || "Untitled session";

  return { source, sessionDate: dateStr, slug, title };
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
