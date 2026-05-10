<!--

                       .-""""""-.
                     .'          '.
                    /   O      O   \
                   :           `    :
                   |                |
                   :    .------.    :
                    \  '        '  /
                     '. '-......-' .'
                       '-.,____,.-'
                          )    (
                         )      (
                        )        (
                       /‾\/‾\/‾\/‾\

           every coding session, haunted

-->

# 👻 haunt

> *what would you do if you had access to **all** your coding sessions?*

A little daemon that catches every session the moment it ends — Claude Code, Codex, Cursor — and stows it as clean, searchable markdown. Install once. Run it forever. Forget it's there until you need it.

**Live:** [haunt-pied.vercel.app](https://haunt-pied.vercel.app) · **Source:** this repo

```
   .──────────.       ┌─────────────────┐
  ( your work  ) ───▶ │  ~/.claude       │       ┌──────────────┐
  ( in claude  )      │  ~/.codex        │ ───▶  │  haunt cloud │
  ( codex,     )      │  ~/Library/.../  │       │  (or local)  │
  ( cursor     )      │      cursor      │       └──────────────┘
   '──────────'       └─────────────────┘             │
                              │                       ▼
                       Stop hook (Claude)        ┌──────────────┐
                       30s watcher (others)      │  /app        │
                              │                  │  search      │
                              ▼                  │  filter      │
                        clean markdown   ───▶    │  read        │
                                                 └──────────────┘
```

## Why

You finished a session. You closed the terminal. The conversation that fixed your migration / shipped your feature / convinced you to reroll a class is now sitting in a JSONL on your disk that you'll never open. Multiply that by 700 sessions. That's a logbook of how you actually think — and right now it's invisible to you.

`haunt` makes it visible.

## What it does

| Track | Source | Trigger | Latency |
|---|---|---|---|
| Hook | Claude Code | `Stop` event in `~/.claude/settings.json` | real-time |
| Watch | Codex CLI | poll `~/.codex/sessions/` | ≤30 s |
| Watch | Cursor (composer + agent) | poll `state.vscdb` SQLite | ≤30 s |

Each captured session becomes a markdown file with a clean conversational layout — turn-by-turn, tool calls collapsed, code blocks rendered. Filename pattern:

```
~/Documents/claude-logs/2026-05-10/claude__migration-review__a93f1c.md
~/Documents/claude-logs/2026-05-10/codex__build-script-fix__019d97cf.md
~/Documents/claude-logs/2026-05-10/cursor__sidebar-redesign__012c0571.md
```

Plus a `_index.md` per day, grouped by source.

## Quick start

If you already have a Mac, sign in with GitHub at [haunt-pied.vercel.app](https://haunt-pied.vercel.app), copy your install command, paste it into a terminal:

```bash
$ curl -fsSL https://haunt-pied.vercel.app/api/v1/install/<your-token> | sh
```

That single command:

1. Wires the Stop hook in `~/.claude/settings.json` (real-time Claude Code archiving).
2. Drops a `LaunchAgent` plist for the watcher (real-time Codex + Cursor).
3. Downloads `Haunt.app` to `/Applications`, strips quarantine, launches it (ghost in the menu bar).
4. Backfills every existing session you have — ~1,000 of them in ~30 seconds, parallelized.

You can also do it the old-fashioned way: clone this repo, run `python3 archive.py install`, paste creds into the menu-bar app's settings. Both paths land in the same place.

## What it's not

- **Not a logger.** It doesn't watch you type or instrument your tools. It reads the JSONL/SQLite files those tools already write to disk. Zero in-band overhead.
- **Not a proprietary format.** The output is plain markdown. You can `grep`, `cat`, or open it in any reader.
- **Not opinionated about where it goes.** Local folder by default. Switch to your VPS, a Vercel endpoint (this repo's API), or your own cloud by editing one config key.

## Privacy

The cloud backend in this repo stores plaintext markdown today. The operator (whoever runs the Vercel project) can technically read every uploaded session. End-to-end encryption with client-held keys is on the roadmap — see `ROADMAP.md` if you're curious about what that'd mean for server-side search.

If you don't want to trust an operator at all, run the daemon in `local` mode and never send anything to the cloud. The full archiver works offline.

## Stack

- **Daemon** — single-file Python (`archive.py`), stdlib only. Reads JSONL (Claude/Codex) and SQLite (Cursor), renders markdown, ships to a backend.
- **Mac app** — SwiftPM + SwiftUI menu-bar utility (`HauntApp/`). Wraps the daemon, paints status, manages the Stop hook + LaunchAgent.
- **Cloud** — Next.js 15 (app router, RSC), NextAuth v5 with GitHub, Drizzle ORM + Vercel Postgres, Vercel Blob for markdown bodies.
- **Brand** — pure black, paper-white, phosphor green for `live` indicators only. Pretendard for prose, JetBrains Mono for code.

## Layout

```
app/                          Next.js app router
  page.tsx                    landing
  docs/                       install + reference
  sign-in/                    GitHub OAuth
  app/                        auth-required dashboard
    sessions/[id]/            rendered markdown
    settings/                 token + export + delete
  api/
    auth/[...nextauth]/       NextAuth handler
    v1/sessions/              ingest endpoint
    v1/install/[token]/       generates the personalized install script
components/                   shared React (GhostMark, etc.)
lib/
  auth/                       NextAuth + bearer + token hashing
  db/                         Drizzle schema + client
drizzle/                      generated migrations
public/
  Haunt.app.zip               built menu-bar app, downloadable
```

The Python archiver and Mac-app source live in a sibling repo at `~/.claude/haunt/` for now. Folding them into this monorepo is a TODO.

## Running locally

```bash
pnpm install
cp .env.example .env.local        # paste GitHub OAuth, AUTH_SECRET, Postgres + Blob
pnpm db:push
pnpm dev                          # http://localhost:3000
```

See [`DEPLOY.md`](./DEPLOY.md) for the six-command production setup.

## License

MIT. Take it, fork it, host your own. Just don't pretend you wrote the ghost — he wrote himself.

---

```
                                                    ~ boo ~
                                              .-""""""-.
                                            .'          '.
                                           /   o      o   \
                                          :        ω       :
                                           \              /
                                            '.,_______,.'
                                            )    /\    (
                                           (    /  \    )
                                            )  /    \  (
                                           (  /      \  )
                                            \/        \/
```
