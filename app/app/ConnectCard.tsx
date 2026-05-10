"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";

interface Props {
  /** Plaintext token; only present on the render that minted it. */
  plaintext: string | null;
  /** Did the user already have a token coming into this render? */
  hasExistingToken: boolean;
  /** Has any session been uploaded? Drives the collapsed "live" mode. */
  userHasSessions: boolean;
}

const HOST = "https://haunt-pied.vercel.app";

export default function ConnectCard({
  plaintext,
  hasExistingToken,
  userHasSessions,
}: Props) {
  // Collapsed mode: sessions exist + no fresh token to surface.
  if (userHasSessions && !plaintext) {
    return (
      <div className="connect-status" role="status">
        <span className="connect-status-pulse" aria-hidden="true" />
        <span className="connect-status-text">
          <strong>Connected.</strong> Your archiver is streaming sessions to the cloud.
        </span>
        <a className="connect-status-link" href="/app/settings">
          Add another machine →
        </a>
      </div>
    );
  }

  return (
    <OnboardingCard plaintext={plaintext} hasExistingToken={hasExistingToken} />
  );
}

/* ------------------------------------------------------------------ */

function OnboardingCard({
  plaintext,
  hasExistingToken,
}: {
  plaintext: string | null;
  hasExistingToken: boolean;
}) {
  const [showManual, setShowManual] = useState(false);
  const curlCmd = plaintext
    ? `curl -fsSL ${HOST}/api/v1/install/${plaintext} | sh`
    : "";

  return (
    <section className="onboard">
      <header className="onboard-head">
        <h2 className="onboard-title">Get Haunt running</h2>
        <p className="onboard-sub">
          One paste. Wires the Stop hook, schedules the watcher, installs the menu-bar
          app, and backfills every existing Claude / Codex / Cursor session you have.
        </p>
      </header>

      {curlCmd ? (
        <>
          <div className="connect-pill onboard-pill">
            <span className="connect-prompt">$</span>
            <code className="connect-cmd">{curlCmd}</code>
            <CopyButton value={curlCmd} className="connect-copy" label="Copy" />
          </div>

          <ul className="onboard-after">
            <li>
              <span className="onboard-after-num">①</span>
              Stop hook + watcher LaunchAgent registered
            </li>
            <li>
              <span className="onboard-after-num">②</span>
              <code>Haunt.app</code> downloaded to <code>/Applications</code> and launched
              — ghost in the menu bar
            </li>
            <li>
              <span className="onboard-after-num">③</span>
              Existing sessions stream to your cloud account in the background
            </li>
          </ul>

          {hasExistingToken && (
            <div className="onboard-foot-note">
              Generating a new token here revoked any previous one.
            </div>
          )}
        </>
      ) : (
        <p className="onboard-sub">Generating your install command…</p>
      )}

      <div className="onboard-divider">
        <button
          type="button"
          className="onboard-toggle-cli"
          onClick={() => setShowManual((v) => !v)}
          aria-expanded={showManual}
        >
          {showManual ? "▾" : "▸"} Don&apos;t want to run a script? Install manually
        </button>
      </div>

      {showManual && (
        <div className="onboard-cli">
          <ol className="onboard-steps">
            <li className="onboard-step">
              <span className="onboard-step-num">1</span>
              <div className="onboard-step-body">
                <div className="onboard-step-title">Download the app</div>
                <div className="onboard-step-meta">
                  Universal · macOS 13+ · 1.4 MB · ad-hoc signed
                </div>
                <a
                  className="btn btn-primary btn-onboard"
                  href="/Haunt.app.zip"
                  download
                >
                  <AppleIcon />
                  Download Haunt.app.zip
                </a>
              </div>
            </li>

            <li className="onboard-step">
              <span className="onboard-step-num">2</span>
              <div className="onboard-step-body">
                <div className="onboard-step-title">Open it past Gatekeeper</div>
                <div className="onboard-step-meta">
                  After moving Haunt.app into <code>/Applications</code>, pick the path
                  that&apos;s easiest for you:
                </div>
                <ul className="onboard-step-substeps">
                  <li>
                    <b>One-line shell fix</b> — paste this once. Removes the quarantine
                    flag macOS adds to internet downloads and opens the app:
                    <CredRow
                      label=""
                      value="xattr -dr com.apple.quarantine /Applications/Haunt.app && open -a Haunt"
                    />
                  </li>
                  <li>
                    <b>Or via System Settings</b> — try opening <code>Haunt.app</code>{" "}
                    once (it&apos;ll be blocked). Then go to{" "}
                    <b>System Settings → Privacy &amp; Security</b>, scroll to the
                    bottom, click <b>Open Anyway</b> next to the Haunt notice. Confirm
                    with your password.
                  </li>
                </ul>
              </div>
            </li>

            <li className="onboard-step">
              <span className="onboard-step-num">3</span>
              <div className="onboard-step-body">
                <div className="onboard-step-title">Paste these credentials</div>
                <div className="onboard-step-meta">
                  Click the ghost in the menu bar → <b>Settings</b> →{" "}
                  <b>Backend</b> → <b>Vercel</b>. Save.
                </div>
                <div className="onboard-creds">
                  <CredRow label="Endpoint" value={`${HOST}/api/v1/sessions`} />
                  <CredRow
                    label="Token"
                    value={plaintext ?? "<generating…>"}
                    secret
                  />
                </div>
              </div>
            </li>
          </ol>
        </div>
      )}
    </section>
  );
}

function CredRow({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  return (
    <div className={`onboard-cred ${label ? "" : "onboard-cred-nolabel"}`}>
      {label && <span className="onboard-cred-label">{label}</span>}
      <code className={`onboard-cred-value mono ${secret ? "secret" : ""}`}>
        {value}
      </code>
      <CopyButton value={value} className="onboard-cred-copy" label="Copy" />
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M11.18 8.45c0-1.96 1.6-2.9 1.67-2.95-.92-1.34-2.34-1.52-2.84-1.54-1.21-.13-2.36.71-2.97.71-.61 0-1.56-.7-2.57-.68-1.32.02-2.55.77-3.23 1.96-1.38 2.39-.35 5.93.99 7.88.66.95 1.43 2.02 2.44 1.98.98-.04 1.35-.63 2.54-.63 1.18 0 1.52.63 2.55.61 1.05-.02 1.72-.97 2.36-1.93.74-1.11 1.05-2.18 1.07-2.24-.02-.01-2.05-.79-2.07-3.13zM9.31 2.96c.54-.65.9-1.56.8-2.46-.78.03-1.71.52-2.27 1.17-.5.57-.94 1.49-.82 2.38.86.07 1.75-.44 2.29-1.09z"
        fill="currentColor"
      />
    </svg>
  );
}
