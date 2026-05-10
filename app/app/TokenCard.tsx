"use client";

import { useState, useTransition } from "react";
import CopyButton from "@/components/CopyButton";
import { generateApiToken, revokeApiToken } from "./actions";

interface Props {
  userEmail?: string;
  active: {
    id: string;
    masked: string;
    lastUsedAt: string | null;
    createdAt: string;
  } | null;
  // Plaintext is only present for one render after generation, then dropped
  // from the URL by the user / a refresh.
  freshPlaintext: string | null;
}

const ENDPOINT_URL = "https://haunt-pied.vercel.app/api/v1/sessions";

export default function TokenCard({ active, freshPlaintext }: Props) {
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(false);

  const tokenForSnippet = freshPlaintext ?? "<paste the token shown after generating>";
  const configSnippet = `{
  "backend": "vercel",
  "vercel": {
    "url": "${ENDPOINT_URL}",
    "token": "${tokenForSnippet}"
  }
}`;

  return (
    <section className="card">
      <div className="card-head">
        <h2>API token</h2>
        <span className="label">
          {active ? `created ${formatDate(active.createdAt)}` : "no token"}
        </span>
      </div>

      <p>
        Your archiver authenticates with a personal token. We store only the SHA-256
        hash; the plaintext is shown <strong>once</strong> at generation. Lose it and
        you&apos;ll need to regenerate.
      </p>

      {freshPlaintext ? (
        <>
          <div className="callout">
            <strong>Copy this now.</strong> This is the only time you&apos;ll see it.
            Refresh the page and it&apos;s gone.
          </div>
          <div className="token-row">
            <code className="token-display fresh">{freshPlaintext}</code>
            <CopyButton value={freshPlaintext} className="btn btn-sm btn-primary" label="Copy token" />
          </div>
        </>
      ) : active && !revoked ? (
        <div className="token-row">
          <code className="token-display">{active.masked}</code>
          <span className="chip">
            {active.lastUsedAt ? `used ${formatRelative(active.lastUsedAt)}` : "never used"}
          </span>
        </div>
      ) : (
        <div className="token-row">
          <code className="token-display" style={{ color: "var(--muted)" }}>
            no active token — generate one to start archiving
          </code>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <form
          action={() => {
            if (active && !confirm("Generate a new token? The current one will stop working immediately.")) return;
            startTransition(() => {
              generateApiToken();
            });
          }}
        >
          <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
            {active ? "Regenerate" : "Generate token"}
          </button>
        </form>
        {active && !revoked && (
          <form
            action={() => {
              if (!confirm("Revoke the current token? Your archiver will stop working until you generate a new one.")) return;
              startTransition(async () => {
                await revokeApiToken();
                setRevoked(true);
              });
            }}
          >
            <button type="submit" className="btn btn-sm btn-danger" disabled={pending}>
              Revoke
            </button>
          </form>
        )}
      </div>

      <div className="codeblock">
        <div className="codeblock-header">
          <span className="codeblock-lang">~/.claude/haunt/config.json</span>
          <CopyButton value={configSnippet} />
        </div>
        <pre>{configSnippet}</pre>
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--muted)" }}>
        Drop that into <code>~/.claude/haunt/config.json</code> and your next session will
        ship to the cloud automatically.
      </p>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
