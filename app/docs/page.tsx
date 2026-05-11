import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import Footer from "@/components/Footer";
import CopyButton from "@/components/CopyButton";
import DocsSidebarHighlighter from "./DocsSidebarHighlighter";

export const metadata = {
  title: "Docs — Haunt",
  description:
    "Install, configure backends, run commands, troubleshoot. Haunt — every coding session, haunted (Claude Code, Codex, Cursor).",
};

// JSX port of docs.html. Copy preserved verbatim. Sidebar active-link
// tracking lives in the small client component below.
export default function DocsPage() {
  return (
    <>
      <MarketingNav activeDocs />

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Table of contents">
          <h4>Getting started</h4>
          <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#install">Install</a></li>
            <li><a href="#layout">Layout</a></li>
          </ul>
          <h4>Backends</h4>
          <ul>
            <li><a href="#backends">Choosing one</a></li>
            <li><a href="#backend-local">Local folder</a></li>
            <li><a href="#backend-vps">VPS over SSH</a></li>
            <li><a href="#backend-vercel">Vercel endpoint</a></li>
            <li><a href="#backend-cloud">Haunt cloud</a></li>
            <li><a href="#backend-custom">Adding your own</a></li>
          </ul>
          <h4>Operating it</h4>
          <ul>
            <li><a href="#commands">Manual commands</a></li>
            <li><a href="#config">Config reference</a></li>
            <li><a href="#state">State &amp; idempotency</a></li>
            <li><a href="#disable">Disable / re-enable</a></li>
          </ul>
          <h4>Reference</h4>
          <ul>
            <li><a href="#output">Output format</a></li>
            <li><a href="#troubleshooting">Troubleshooting</a></li>
          </ul>
        </aside>

        <main className="docs-content">
          <h2 id="overview">Overview</h2>
          <p>
            <strong>Haunt</strong> catches every AI coding session as it ends — Claude
            Code, Codex CLI, and Cursor — and turns it into clean, searchable markdown.
            One Python file, zero dependencies, plus a small Mac menu-bar app for config.
          </p>
          <p>Two ingestion tracks, depending on what the source supports:</p>
          <ul>
            <li>
              <strong>Stop hook</strong> in <code>~/.claude/settings.json</code> —
              real-time for Claude Code. Async, so your prompt is never blocked.
            </li>
            <li>
              <strong>Watcher LaunchAgent</strong> (<code>com.haunt.watch</code>) — polls{" "}
              <code>~/.codex/sessions/</code> and Cursor&apos;s SQLite store every 30s,
              archives any new content. Belt-and-suspenders for sources without native
              hooks.
            </li>
          </ul>

          <div className="callout">
            <strong>Single file, zero deps.</strong> Everything is in <code>archive.py</code>.
            Standard library only. No virtualenv. No package manager.
          </div>

          <h2 id="install">Install</h2>
          <p>
            One command. Sign in at <a href="/app">/app</a>, copy your personalized
            install command (your token baked in), paste it into any terminal:
          </p>
          <CodeBlock
            lang="bash"
            code={`$ curl -fsSL https://haunt-pied.vercel.app/api/v1/install/<your-token> | sh`}
          />
          <p>
            Wires the Stop hook, schedules the watcher, kicks off a parallel
            backfill of every existing Claude / Codex / Cursor session, and
            returns your prompt in about a second. Idempotent — safe to re-run
            whenever you regenerate a token.
          </p>

          <h3 id="install-claude">From inside Claude Code</h3>
          <p>
            If you&apos;re already in a Claude Code session and have the archiver
            on disk, the slash command shortcut runs the same flow:
          </p>
          <CodeBlock lang="claude code" code={`/haunt install`} />

          <h3 id="install-already">Already have the script?</h3>
          <p>
            If <code>~/.claude/haunt/archive.py</code> exists (you ran the curl
            install previously), this re-applies everything from scratch.
            Idempotent — safe to re-run.
          </p>
          <CodeBlock lang="bash" code={`$ python3 ~/.claude/haunt/archive.py install`} />

          <div className="callout">
            <strong>What gets wired:</strong> a Stop hook in{" "}
            <code>~/.claude/settings.json</code> (real-time, async — Claude Code), a
            watcher LaunchAgent at{" "}
            <code>~/Library/LaunchAgents/com.haunt.watch.plist</code> (30-second poll —
            Codex + Cursor), and a one-shot backfill of every session under{" "}
            <code>~/.claude/projects/</code>, <code>~/.codex/sessions/</code>, and
            Cursor&apos;s SQLite store. Re-runnable, undo-able with{" "}
            <code>uninstall</code>.
          </div>

          <h2 id="layout">Layout</h2>
          <CodeBlock
            lang="tree"
            code={`~/.claude/Haunt/
├── archive.py        # the whole thing — parser + renderer + dispatcher
├── config.json       # backend choice + creds (edit this)
├── state.json        # per-session fingerprints, prevents re-uploads
└── logs/
    ├── archive.log   # operational log
    └── launchd.*     # stdout/stderr from the daily run`}
          />
          <p>Default output (local backend):</p>
          <CodeBlock
            lang="tree"
            code={`~/Documents/claude-logs/
└── 2026-05-10/
    ├── _index.md                                  # daily roll-up with previews
    ├── build-claude-sessions-cloud-backup__24457bf2.md
    ├── add-language-picker-switch__b7d98826.md
    └── …`}
          />

          <h2 id="backends">Choosing a backend</h2>
          <p>
            Set <code>backend</code> in <code>~/.claude/Haunt/config.json</code>. The
            script auto-creates a default config on first run; edit it whenever you want
            to switch.
          </p>

          <h3 id="backend-local">Local folder (default)</h3>
          <CodeBlock
            lang="json — config.json"
            code={`{
  "backend": "local",
  "local": { "root": "~/Documents/claude-logs" }
}`}
          />
          <p>
            Sync the folder however you like — iCloud, Dropbox, Syncthing, a git repo. The
            archiver doesn&apos;t care.
          </p>

          <h3 id="backend-vps">VPS over SSH</h3>
          <CodeBlock
            lang="json — config.json"
            code={`{
  "backend": "vps",
  "vps": {
    "user": "abhishek",
    "host": "vps.example.com",
    "remote_root": "~/claude-logs",
    "ssh_key": "~/.ssh/id_ed25519"
  }
}`}
          />
          <p>
            Uses <code>ssh</code> + <code>scp</code> from your shell. Key-based auth only
            — the script never prompts. The remote directory is created on first upload.
          </p>

          <h3 id="backend-vercel">Vercel endpoint (your own)</h3>
          <CodeBlock
            lang="json — config.json"
            code={`{
  "backend": "vercel",
  "vercel": {
    "url": "https://your-app.vercel.app/api/claude-log",
    "token": "shared-secret"
  }
}`}
          />
          <p>
            Posts a JSON body to your URL with{" "}
            <code>Authorization: Bearer &lt;token&gt;</code>:
          </p>
          <CodeBlock
            lang="json — request body"
            code={`{
  "path": "2026-05-10/add-language-picker-switch__b7d98826.md",
  "content": "# Add language picker switch\\n…"
}`}
          />

          <h3 id="backend-cloud">Haunt cloud</h3>
          <p>
            Don&apos;t want to host anything? Sign in with GitHub at{" "}
            <a href="/sign-in">haunt-pied.vercel.app</a>, generate an API token from your{" "}
            <a href="/app">dashboard</a>, and paste the snippet below into{" "}
            <code>~/.claude/haunt/config.json</code>. Everything you archive shows up at{" "}
            <a href="/app">/app</a> — searchable, owner-scoped, free while it&apos;s in
            beta.
          </p>
          <CodeBlock
            lang="json — config.json"
            code={`{
  "backend": "vercel",
  "vercel": {
    "url": "https://haunt-pied.vercel.app/api/v1/sessions",
    "token": "<token from /app>"
  }
}`}
          />

          <h3 id="backend-custom">Adding your own</h3>
          <p>
            Backends in <code>archive.py</code> are just functions of the form:
          </p>
          <CodeBlock
            lang="python"
            code={`def _backend_yourname(rel_path: str, body: str, conf: dict) -> None:
    # rel_path: "2026-05-10/some-session__abcd1234.md"
    # body:     the rendered markdown
    # conf:     config.json["yourname"]
    ...`}
          />
          <p>
            Add one line to <code>dispatch()</code> and you&apos;re done. Around 10 lines
            for an S3 backend, less for git.
          </p>

          <h2 id="commands">Manual commands</h2>
          <table>
            <thead>
              <tr>
                <th>Command</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>archive.py session &lt;file&gt;</code></td>
                <td>Archive one specific JSONL. Used by the Stop hook.</td>
              </tr>
              <tr>
                <td><code>archive.py daily</code></td>
                <td>Today&apos;s sessions + write the daily index. Used by the LaunchAgent.</td>
              </tr>
              <tr>
                <td><code>archive.py daily --date 2026-05-09</code></td>
                <td>Re-process a specific date.</td>
              </tr>
              <tr>
                <td><code>archive.py backfill</code></td>
                <td>Every session ever recorded. Idempotent.</td>
              </tr>
              <tr>
                <td><code>archive.py … --force</code></td>
                <td>
                  Ignore <code>state.json</code> and re-upload everything.
                </td>
              </tr>
            </tbody>
          </table>

          <h2 id="config">Config reference</h2>
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Default</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>backend</code></td>
                <td><code>&quot;local&quot;</code></td>
                <td>
                  <code>local</code>, <code>vps</code>, or <code>vercel</code>.
                </td>
              </tr>
              <tr>
                <td><code>include_tool_results</code></td>
                <td><code>true</code></td>
                <td>
                  Embed tool stdout in <code>&lt;details&gt;</code> blocks.
                </td>
              </tr>
              <tr>
                <td><code>tool_result_max_lines</code></td>
                <td><code>40</code></td>
                <td>Per-result truncation cap.</td>
              </tr>
              <tr>
                <td><code>skip_short_sessions_turns</code></td>
                <td><code>0</code></td>
                <td>Skip sessions with fewer than N user turns.</td>
              </tr>
              <tr>
                <td><code>local_tz</code></td>
                <td><code>&quot;Asia/Kolkata&quot;</code></td>
                <td>Timezone for date bucketing &amp; timestamps.</td>
              </tr>
            </tbody>
          </table>

          <h2 id="state">State &amp; idempotency</h2>
          <p>
            <code>state.json</code> stores <code>&lt;size&gt;:&lt;mtime&gt;</code> per
            JSONL path. A session is re-uploaded only when its file grows or changes —
            typical for sessions that are still active, or that you resume later. Sessions
            deleted from <code>~/.claude/projects/</code> stay archived in your destination.
          </p>
          <p>
            If something looks wrong, delete <code>state.json</code> and run{" "}
            <code>backfill</code>. It&apos;s that simple.
          </p>

          <h2 id="disable">Disable / re-enable</h2>
          <CodeBlock
            lang="bash"
            code={`# Pause the watcher (Codex + Cursor stop being polled)
$ launchctl unload ~/Library/LaunchAgents/com.haunt.watch.plist

# Resume it
$ launchctl load -w ~/Library/LaunchAgents/com.haunt.watch.plist`}
          />
          <p>
            To pause per-session uploads, remove the <code>hooks.Stop</code> block from{" "}
            <code>~/.claude/settings.json</code>.
          </p>

          <h2 id="output">Output format</h2>
          <p>Each session becomes a single markdown file with this shape:</p>
          <CodeBlock
            lang="markdown"
            code={`# Build Claude sessions cloud backup system

- **When:** 2026-05-10 12:58:30 IST
- **Project:** \`company\` — \`/Users/abhishek/Documents/GitHub/company\`
- **Branch:** \`main\`
- **Session ID:** \`24457bf2-d3b3-49dc-9573-daa93fe87488\`
- **Turns:** 14 user / 20 assistant

---

### User · 12:58:30

build something that automatically takes allllll of my claude sessions…

### Assistant · 12:58:35

Got it. Let me first check how Claude stores sessions on your machine.

**Tool · Bash** — \`ls -la ~/.claude/\`

\`\`\`bash
ls -la ~/.claude/
\`\`\`

<details><summary>Result</summary>

\`\`\`
total 2200
drwx------   26 abhishek  staff  ...
\`\`\`
</details>`}
          />

          <h2 id="troubleshooting">Troubleshooting</h2>

          <h3>The Stop hook isn&apos;t firing</h3>
          <ul>
            <li>
              Run <code>claude --debug</code> and look for hook execution logs.
            </li>
            <li>
              Verify JSON parses:{" "}
              <code>
                python3 -c &quot;import json; json.load(open(&apos;/Users/you/.claude/settings.json&apos;))&quot;
              </code>
              . Invalid JSON disables <em>all</em> settings silently.
            </li>
            <li>
              If you just installed the hook, open <code>/hooks</code> in Claude Code once
              — the watcher only re-reads settings.json after a session that started with
              one.
            </li>
          </ul>

          <h3>The LaunchAgent isn&apos;t running</h3>
          <ul>
            <li>
              <code>launchctl list | grep claude-archiver</code> — should print one row.
            </li>
            <li>
              Check <code>~/.claude/Haunt/logs/launchd.err</code> for stderr.
            </li>
            <li>
              Path issue? LaunchAgents have a minimal <code>$PATH</code>. Use absolute
              paths everywhere — <code>/usr/bin/python3</code>, not <code>python3</code>.
            </li>
          </ul>

          <h3>VPS uploads fail with auth error</h3>
          <ul>
            <li>
              Try the same <code>ssh user@host</code> manually first. The archiver
              doesn&apos;t do anything magical — if your shell can&apos;t connect, neither
              can it.
            </li>
            <li>
              Use <code>StrictHostKeyChecking=accept-new</code> on first run (already set).
            </li>
            <li>
              Confirm the key in <code>config.json</code> has no passphrase, or is loaded
              into <code>ssh-agent</code>.
            </li>
          </ul>

          <h3>I want to start over</h3>
          <CodeBlock
            lang="bash"
            code={`$ rm ~/.claude/Haunt/state.json
$ python3 ~/.claude/Haunt/archive.py backfill`}
          />

          <hr />
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Built in one afternoon. Reads JSONL straight out of{" "}
            <code>~/.claude/projects/</code> — no API calls, no auth dance. If Claude
            Code&apos;s storage layout ever changes, the parser is ~80 lines.
          </p>
        </main>
      </div>

      <Footer
        rightSlot={
          <>
            <Link href="/">home</Link> · <a href="#overview">top</a>
          </>
        }
      />

      <DocsSidebarHighlighter />
    </>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span className="codeblock-lang">{lang}</span>
        <CopyButton value={code} />
      </div>
      <pre>{code}</pre>
    </div>
  );
}
