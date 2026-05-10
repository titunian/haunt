import SourceIcon from "@/components/SourceIcon";

interface Props {
  title: string;
  source: string;
  sessionDate: string | Date;
  project: string | null;
  byteSize: number;
  slug: string;
  createdAt: Date;
}

/**
 * Top-of-page metadata card. Renders the DB-stored fields (which are the
 * authoritative copy of session metadata) as a tight, well-typeset header.
 * Everything below this card is the rendered conversation body.
 */
export default function FrontmatterCard({
  title,
  source,
  sessionDate,
  project,
  byteSize,
  slug,
  createdAt,
}: Props) {
  const date =
    typeof sessionDate === "string"
      ? sessionDate
      : sessionDate.toISOString().slice(0, 10);
  const uploadedAt = createdAt.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <header className="session-frontmatter">
      <h1 className="session-frontmatter-title">{title}</h1>

      <dl className="session-frontmatter-meta">
        <Row label="Source">
          <span className="session-frontmatter-src">
            <SourceIcon source={source} size={11} />
            {source}
          </span>
        </Row>
        <Row label="Date">
          <time dateTime={date}>{formatDate(date)}</time>
        </Row>
        {project && (
          <Row label="Project">
            <code className="session-frontmatter-code">{project}</code>
          </Row>
        )}
        <Row label="Size">{formatBytes(byteSize)}</Row>
        <Row label="Uploaded">
          <time dateTime={createdAt.toISOString()}>{uploadedAt}</time>
        </Row>
        <Row label="Slug">
          <code className="session-frontmatter-code session-frontmatter-slug">
            {slug}
          </code>
        </Row>
      </dl>
    </header>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="session-frontmatter-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
