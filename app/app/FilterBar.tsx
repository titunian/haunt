import Link from "next/link";
import ProjectSelect from "./ProjectSelect";
import LiveSearch from "./LiveSearch";

type Filters = {
  source: string | null;
  project: string | null;
  q: string | null;
  range: "7d" | "30d" | "all";
};

interface Props {
  filters: Filters;
  projectOptions: string[];
}

/**
 * Server component. URL params drive every filter; pills are <Link>s that
 * preserve the other filters, project and search are plain forms that submit
 * to /app with the rest of the filters as hidden inputs.
 */
export default function FilterBar({ filters, projectOptions }: Props) {
  const buildHref = (overrides: Partial<Filters>) => {
    const merged = { ...filters, ...overrides };
    const sp = new URLSearchParams();
    if (merged.source) sp.set("source", merged.source);
    if (merged.project) sp.set("project", merged.project);
    if (merged.q) sp.set("q", merged.q);
    if (merged.range !== "all") sp.set("range", merged.range);
    const qs = sp.toString();
    return qs ? `/app?${qs}` : "/app";
  };

  const pill = (
    label: string,
    field: "source" | "range",
    value: string | null,
    activeWhen: boolean,
  ) => (
    <Link
      key={`${field}:${value}`}
      href={buildHref(
        field === "range"
          ? { range: (value ?? "all") as Filters["range"] }
          : ({ [field]: value } as Partial<Filters>),
      )}
      className={`filter-pill ${activeWhen ? "active" : ""}`}
    >
      {label}
    </Link>
  );

  // Hidden inputs preserve every filter that isn't the one being changed by
  // the search form.
  const hasFilters =
    filters.source || filters.project || filters.q || filters.range !== "all";

  // Removable chip for an active filter — clicking the × clears just that one.
  const chip = (
    label: string,
    field: "source" | "project" | "q" | "range",
    clearTo: Filters[typeof field],
  ) => (
    <Link
      key={`active:${field}`}
      href={buildHref(
        field === "range"
          ? { range: "all" }
          : ({ [field]: clearTo } as Partial<Filters>),
      )}
      className="filter-chip"
      aria-label={`Remove ${field} filter`}
    >
      <span className="filter-chip-field">{field}</span>
      <span className="filter-chip-value">{label}</span>
      <span className="filter-chip-x" aria-hidden="true">×</span>
    </Link>
  );

  return (
    <div className="filter-bar">
      {hasFilters && (
        <div className="filter-row filter-active-chips" aria-label="Active filters">
          {filters.source && chip(filters.source, "source", null)}
          {filters.range !== "all" && chip(filters.range, "range", "all")}
          {filters.project && chip(filters.project, "project", null)}
          {filters.q && chip(`“${filters.q}”`, "q", null)}
          <Link href="/app" className="filter-clear">clear all</Link>
        </div>
      )}

      <div className="filter-row">
        <LiveSearch initial={filters.q ?? ""} />

        <span className="filter-sep" />

        <div className="filter-pillgroup" role="group" aria-label="Source">
          {pill("all", "source", null, !filters.source)}
          {pill("claude", "source", "claude", filters.source === "claude")}
          {pill("codex", "source", "codex", filters.source === "codex")}
          {pill("cursor", "source", "cursor", filters.source === "cursor")}
        </div>

        <div className="filter-pillgroup" role="group" aria-label="Range">
          {pill("7d", "range", "7d", filters.range === "7d")}
          {pill("30d", "range", "30d", filters.range === "30d")}
          {pill("all", "range", "all", filters.range === "all")}
        </div>

        {projectOptions.length > 0 && (
          <ProjectSelect options={projectOptions} selected={filters.project} />
        )}
      </div>
    </div>
  );
}
