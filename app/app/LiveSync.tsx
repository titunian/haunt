"use client";

import { useEffect, useState } from "react";

interface Props {
  /** ISO of the last archive write, or null if no sessions yet. */
  lastUploadIso: string | null;
}

type Tier = "live" | "recent" | "stale" | "cold" | "never";

/**
 * Live "last sync" indicator. Recomputes the relative timestamp every second
 * so the user can glance at the dashboard and know the watcher is alive
 * without checking logs.
 */
export default function LiveSync({ lastUploadIso }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastUploadIso) {
    return (
      <span className="livesync livesync-never" role="status">
        <span className="livesync-dot" />
        <span className="livesync-text">Waiting for first session…</span>
      </span>
    );
  }

  const ms = now - new Date(lastUploadIso).getTime();
  const tier = tierFor(ms);

  return (
    <span className={`livesync livesync-${tier}`} role="status" title={fullStamp(lastUploadIso)}>
      <span className="livesync-dot" />
      <span className="livesync-text">
        {tier === "live" ? "Live" : "Last sync"}{" "}
        <strong>{relative(ms)}</strong>
        {tier === "stale" && (
          <span className="livesync-hint"> · watcher may be stalled</span>
        )}
        {tier === "cold" && (
          <span className="livesync-hint"> · check the watcher</span>
        )}
      </span>
    </span>
  );
}

function tierFor(ms: number): Tier {
  if (ms < 90_000) return "live";          // < 1.5 min — pulse green
  if (ms < 30 * 60_000) return "recent";   // < 30 min — quiet
  if (ms < 4 * 3600_000) return "stale";   // < 4h — amber
  return "cold";                            // > 4h — red
}

function relative(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function fullStamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
