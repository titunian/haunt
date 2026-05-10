"use client";

import { useState, useTransition } from "react";
import {
  deleteAccount,
  exportData,
  generateApiToken,
  revokeApiToken,
} from "../actions";

interface Props {
  hasActiveToken: boolean;
}

export default function SettingsActions({ hasActiveToken }: Props) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<
    "regen" | "revoke" | "export" | "delete" | null
  >(null);

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>Cloud token</h2>
          <span className="label">{hasActiveToken ? "active" : "none"}</span>
        </div>
        <p>
          {hasActiveToken
            ? "Your archiver authenticates with this token. Regenerate to replace it (the old one stops working immediately) or disconnect to stop the upload."
            : "No active token. Generate one to start archiving sessions to the cloud — the new install command will appear on the dashboard."}
        </p>
        <div className="settings-actions-row">
          <form
            action={() => {
              if (
                hasActiveToken &&
                !window.confirm(
                  "Generate a new token? The current one stops working immediately and your archiver will need the new install command before its next upload.",
                )
              ) {
                return;
              }
              setBusy("regen");
              startTransition(() => {
                generateApiToken();
              });
            }}
          >
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={pending || busy !== null}
            >
              {busy === "regen"
                ? "Generating…"
                : hasActiveToken
                  ? "Regenerate token"
                  : "Generate token"}
            </button>
          </form>
          {hasActiveToken && (
            <form
              action={() => {
                if (
                  !window.confirm(
                    "Disconnect? Your archiver will stop uploading until you generate a new token.",
                  )
                ) {
                  return;
                }
                setBusy("revoke");
                startTransition(async () => {
                  await revokeApiToken();
                  setBusy(null);
                });
              }}
            >
              <button
                type="submit"
                className="btn btn-sm btn-danger"
                disabled={pending || busy !== null}
              >
                {busy === "revoke" ? "Disconnecting…" : "Disconnect"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Export your data</h2>
        </div>
        <p>
          Download a JSON file with metadata for every session you&apos;ve archived.
          Markdown bodies stay in blob storage; the file lists their URLs.
        </p>
        <div className="settings-actions-row">
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy === "export"}
            onClick={async () => {
              setBusy("export");
              try {
                const json = await exportData();
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `haunt-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "export" ? "Preparing…" : "Download JSON"}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 style={{ color: "var(--text)" }}>Delete account</h2>
        </div>
        <p>
          Removes your account, all archived sessions, and any tokens. The markdown
          bodies in blob storage are best-effort deleted. This can&apos;t be undone.
        </p>
        <div className="settings-actions-row">
          <form
            action={() => {
              const confirm1 = window.confirm(
                "Delete your account and every archived session? This can't be undone.",
              );
              if (!confirm1) return;
              const confirm2 = window.prompt(
                'Type "delete my haunt" to confirm.',
              );
              if (confirm2 !== "delete my haunt") return;
              setBusy("delete");
              startTransition(() => {
                deleteAccount();
              });
            }}
          >
            <button
              type="submit"
              className="btn btn-sm btn-danger"
              disabled={pending || busy === "delete"}
            >
              {busy === "delete" ? "Deleting…" : "Delete my account"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
