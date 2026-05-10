import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

/**
 * GET /api/v1/install/<token>
 *
 * Returns a small shell script that wires the local archiver to this user's
 * cloud account. Pasted as `curl -fsSL .../install/<token> | sh` — single
 * step from sign-in to sessions flowing.
 *
 * Token is validated against api_tokens.hash; if invalid we return a script
 * that prints a friendly error and exits, rather than leaking 4xx semantics
 * (curl|sh would otherwise silently no-op on non-2xx).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  const headers = {
    "content-type": "text/x-shellscript; charset=utf-8",
    // Defense-in-depth: even if a CDN cached this, it's only valid for the
    // exact token in the URL.
    "cache-control": "no-store",
  };

  const hash = hashToken(token);
  const rows = await db
    .select({ id: apiTokens.id })
    .from(apiTokens)
    .where(and(eq(apiTokens.hash, hash), isNull(apiTokens.revokedAt)))
    .limit(1);

  if (!rows.length) {
    return new NextResponse(BAD_TOKEN_SCRIPT, { headers, status: 200 });
  }

  const origin =
    process.env.NEXTAUTH_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "haunt-pied.vercel.app"}`;
  const endpoint = `${origin}/api/v1/sessions`;

  return new NextResponse(scriptFor(token, endpoint), { headers, status: 200 });
}

const BAD_TOKEN_SCRIPT = `#!/usr/bin/env bash
echo
echo "  ✗ Haunt: that install URL is invalid or revoked."
echo "  Generate a fresh one at https://haunt-pied.vercel.app/app"
echo
exit 1
`;

function scriptFor(token: string, endpoint: string): string {
  // Single-quote the token & endpoint when interpolating into Python so any
  // accidental shell metacharacters in a future token format can't leak.
  const safeToken = token.replace(/'/g, "'\\''");
  const safeEndpoint = endpoint.replace(/'/g, "'\\''");
  // Derive the host (without /api/...) for the Haunt.app.zip download URL.
  // We do this in JS rather than as a bash parameter expansion because the
  // bash form (${var%suffix}) clashes with JS template-literal syntax inside
  // this template string.
  const safeHost = endpoint.replace(/\/api\/.*$/, "").replace(/'/g, "'\\''");

  return `#!/usr/bin/env bash
set -euo pipefail

SCRIPT="$HOME/.claude/haunt/archive.py"

bold()   { printf "\\033[1m%s\\033[0m" "$1"; }
ok()     { printf "  \\033[32m✓\\033[0m %s\\n" "$1"; }
dim()    { printf "  \\033[90m%s\\033[0m\\n" "$1"; }
err()    { printf "  \\033[31m✗\\033[0m %s\\n" "$1"; }

echo
printf "  \\033[1m◌ Haunt — connecting your Mac\\033[0m\\n"
echo

if [ ! -f "$SCRIPT" ]; then
  err "archive.py not found at $SCRIPT"
  echo
  dim "Install the Mac app first:"
  dim "  https://haunt-pied.vercel.app/Haunt.app.zip"
  echo
  exit 1
fi

# Wire backend = vercel with the user's token
/usr/bin/python3 - <<'PY'
import json, pathlib
p = pathlib.Path.home() / ".claude" / "haunt" / "config.json"
cfg = json.loads(p.read_text()) if p.exists() else {}
cfg["backend"] = "vercel"
cfg.setdefault("vercel", {})
cfg["vercel"]["url"]   = '${safeEndpoint}'
cfg["vercel"]["token"] = '${safeToken}'
p.write_text(json.dumps(cfg, indent=2) + "\\n")
PY
ok "wired ~/.claude/haunt/config.json → cloud"

# Make sure the hook + watcher are registered (idempotent)
/usr/bin/python3 "$SCRIPT" install --skip-backfill >/dev/null 2>&1 || true
ok "Stop hook + watcher confirmed"

# Install Haunt.app to /Applications so the ghost appears in the menu bar.
APP_DEST="/Applications/Haunt.app"
if [ -d "$APP_DEST" ]; then
  ok "Haunt.app already in /Applications"
else
  dim "→ downloading Haunt.app (1.4 MB)…"
  TMP=$(mktemp -d)
  if /usr/bin/curl -fsSL '${safeHost}/Haunt.app.zip' -o "$TMP/Haunt.app.zip"; then
    /usr/bin/ditto -x -k "$TMP/Haunt.app.zip" "$TMP/" 2>/dev/null
    if [ -d "$TMP/Haunt.app" ]; then
      if /bin/cp -R "$TMP/Haunt.app" "$APP_DEST" 2>/dev/null; then
        ok "installed Haunt.app → /Applications"
      else
        mkdir -p "$HOME/Applications"
        /bin/cp -R "$TMP/Haunt.app" "$HOME/Applications/Haunt.app"
        APP_DEST="$HOME/Applications/Haunt.app"
        ok "installed Haunt.app → ~/Applications (no /Applications write access)"
      fi
      /usr/bin/xattr -dr com.apple.quarantine "$APP_DEST" 2>/dev/null || true
    else
      err "Haunt.app.zip extracted but no Haunt.app inside — skipping"
      APP_DEST=""
    fi
  else
    err "couldn't fetch Haunt.app.zip — skipping menu bar app install"
    APP_DEST=""
  fi
  rm -rf "$TMP"
fi

# Launch it so the user sees the ghost immediately.
if [ -n "$APP_DEST" ] && [ -d "$APP_DEST" ]; then
  /usr/bin/open -a "$APP_DEST" 2>/dev/null || true
  ok "Haunt.app launched — look for the ghost in your menu bar"
fi

# Kick the backfill off in the background — 12 parallel uploads keeps a
# 1k-session archive under ~2 min on a typical link, and the user gets
# their terminal back immediately.
LOG="$HOME/.claude/haunt/logs/archive.log"
mkdir -p "$(dirname "$LOG")"
rm -f "$HOME/.claude/haunt/state.json"
nohup /usr/bin/python3 "$SCRIPT" backfill --workers 12 >> "$LOG" 2>&1 &
disown 2>/dev/null || true
ok "backfill running in background (PID $!)"

echo
printf "  \\033[1mDone.\\033[0m Sessions are streaming to the cloud now.\\n"
dim "  Watch progress:  tail -f $LOG"
dim "  Or refresh:      https://haunt-pied.vercel.app/app"
echo
`;
}
