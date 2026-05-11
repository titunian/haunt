"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [busy, setBusy] = useState<"export" | null>(null);

  // Server-action forms below pass the action function DIRECTLY to <form
  // action={...}>. That's the form NextJS knows how to special-case for
  // redirects thrown from inside the action. Wrapping in startTransition
  // surfaces NEXT_REDIRECT as a client-side error (the 500 we were hitting).
  // Confirmation lives in onClick + preventDefault on the submit button.

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
          <form action={generateApiToken}>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                if (
                  hasActiveToken &&
                  !window.confirm(
                    "Generate a new token? The current one stops working immediately and your archiver will need the new install command before its next upload.",
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              {hasActiveToken ? "Regenerate token" : "Generate token"}
            </button>
          </form>
          {hasActiveToken && (
            <form
              action={async () => {
                await revokeApiToken();
                router.refresh();
              }}
            >
              <button
                type="submit"
                className="btn btn-sm btn-danger"
                onClick={(e) => {
                  if (
                    !window.confirm(
                      "Disconnect? Your archiver will stop uploading until you generate a new token.",
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                Disconnect
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
          <form action={deleteAccount}>
            <button
              type="submit"
              className="btn btn-sm btn-danger"
              onClick={(e) => {
                if (
                  !window.confirm(
                    "Delete your account and every archived session? This can't be undone.",
                  )
                ) {
                  e.preventDefault();
                  return;
                }
                const phrase = window.prompt(
                  'Type "delete my haunt" to confirm.',
                );
                if (phrase !== "delete my haunt") e.preventDefault();
              }}
            >
              Delete my account
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
