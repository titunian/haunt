#!/usr/bin/env python3
"""
Phase 0: build the ground-truth eval set.

Stratified sample of 30 sessions drawn from ~/Documents/claude-logs/:

    Claude  14  (5 short, 5 medium, 4 long)
    Cursor  12  (4 short, 4 medium, 4 long)
    Codex    4  (all of them; corpus only has 4)

Length tiers, by markdown byte size:
    short   <  5 KB
    medium  5 – 30 KB
    long    > 30 KB

Output: ~/.claude/haunt/eval/
    sessions/<id>__<source>.md           — copies of the chosen markdown
    ground-truth-template.json           — one entry per session with empty
                                            fields ready to hand-fill
    index.json                            — metadata (paths, sizes, source,
                                            length tier) for the runner

Hand-labeling instructions are in ground-truth-template.json's `_meta` block.

Re-run is idempotent against the random seed; bump SEED to draw a new sample.
"""

from __future__ import annotations

import json
import random
import shutil
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path

# ── Knobs ───────────────────────────────────────────────────────────────────

SOURCE_QUOTA = {
    "claude": {"short": 5, "medium": 5, "long": 4},
    "cursor": {"short": 4, "medium": 4, "long": 4},
    "codex":  {"short": 99, "medium": 99, "long": 99},  # take everything
}
SHORT_KB = 5
MEDIUM_KB = 30
SEED = 11  # bump to redraw

LOG_ROOT = Path.home() / "Documents" / "claude-logs"
EVAL_ROOT = Path.home() / ".claude" / "haunt" / "eval"


# ── Types ───────────────────────────────────────────────────────────────────

@dataclass
class Pick:
    source: str           # 'claude' | 'codex' | 'cursor'
    tier: str             # 'short' | 'medium' | 'long'
    src_path: str         # absolute path to original
    dst_filename: str     # name in eval/sessions/
    size_bytes: int


# ── Walk + classify ─────────────────────────────────────────────────────────

def classify_tier(size_bytes: int) -> str:
    kb = size_bytes / 1024
    if kb < SHORT_KB:
        return "short"
    if kb < MEDIUM_KB:
        return "medium"
    return "long"


def detect_source(name: str) -> str | None:
    for s in ("claude", "codex", "cursor"):
        if name.startswith(f"{s}__"):
            return s
    return None


def gather() -> dict[tuple[str, str], list[Path]]:
    """Group every archived session by (source, tier)."""
    buckets: dict[tuple[str, str], list[Path]] = defaultdict(list)
    for md in LOG_ROOT.rglob("*.md"):
        if md.name == "_index.md":
            continue
        src = detect_source(md.name)
        if src is None:
            continue
        tier = classify_tier(md.stat().st_size)
        buckets[(src, tier)].append(md)
    return buckets


# ── Sample ──────────────────────────────────────────────────────────────────

def sample_stratified() -> list[Pick]:
    rng = random.Random(SEED)
    buckets = gather()
    picks: list[Pick] = []
    for source, tiers in SOURCE_QUOTA.items():
        for tier, want in tiers.items():
            available = buckets.get((source, tier), [])
            chosen = rng.sample(available, k=min(want, len(available)))
            for p in chosen:
                # Use the full original stem so two sessions that happen to
                # share a short id-suffix (legacy `__agent-XX` naming) don't
                # collide when copied into the flat eval directory.
                # The `source__` prefix may be absent on legacy files —
                # ensure we still produce a recognizable, unique filename.
                stem = p.stem
                if not stem.startswith(f"{source}__"):
                    stem = f"{source}__{stem}"
                picks.append(Pick(
                    source=source,
                    tier=tier,
                    src_path=str(p),
                    dst_filename=f"{stem}.md",
                    size_bytes=p.stat().st_size,
                ))
    return picks


# ── Write the eval directory ────────────────────────────────────────────────

GROUND_TRUTH_DOC = """\
# Hand-labeling instructions

For each session below, fill in the fields **based only on what's actually in
the session body**. Do NOT speculate. Empty/null is correct when the session
has nothing to say in that field.

- `summary`             — 2–4 sentences. Plain English. What did the user
                          come in wanting, what happened, what was the
                          outcome? Avoid LLM-stylistic phrasing.
- `decisions`           — list of `{what, why, alternatives?}`. Only choices
                          that were CONSCIOUSLY made (e.g. "use age over
                          libsodium because [reason]"). Don't list code
                          changes as decisions.
- `bugs_solved`         — list of `{symptom, cause, fix}`. The session
                          actually fixed something — symptom you saw,
                          root cause, what made it go away.
- `questions_open`      — strings. Unresolved at session end. "I should
                          confirm X" / "still unclear whether Y."
- `facts_learned`       — atomic, transferable. "ditto -c -k keeps
                          resource forks". Not "I edited file foo.ts."
- `tools_used`          — libraries, commands, services TOUCHED in the
                          session. Includes Bash commands actually run,
                          packages imported, APIs called.
- `themes`              — free-form tags. ~3–6 per session. Vocabulary
                          you'd use to find this session later.

If a session is mostly noise (typo fix, single-turn nothing), it can have
empty arrays everywhere except `summary` — that's fine, it represents the
real distribution.

Save when done. The eval runner will compare LLM-extracted output against
these labels with both string-similarity (for `summary`) and set-overlap
(for the list fields) to compute per-field F1.
"""


def write_eval_dir(picks: list[Pick]) -> None:
    sessions_dir = EVAL_ROOT / "sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)

    # Clean any previous sample, so the directory only ever has the current set
    for old in sessions_dir.glob("*.md"):
        old.unlink()

    index: list[dict] = []
    ground_truth: dict[str, dict] = {}

    for p in picks:
        dst = sessions_dir / p.dst_filename
        shutil.copy(p.src_path, dst)
        index.append(asdict(p))
        ground_truth[p.dst_filename] = {
            "summary": "",
            "decisions": [],
            "bugs_solved": [],
            "questions_open": [],
            "facts_learned": [],
            "tools_used": [],
            "themes": [],
        }

    (EVAL_ROOT / "index.json").write_text(json.dumps(index, indent=2) + "\n")
    template = {
        "_meta": {
            "instructions": GROUND_TRUTH_DOC,
            "seed": SEED,
            "n": len(picks),
        },
        "sessions": ground_truth,
    }
    (EVAL_ROOT / "ground-truth-template.json").write_text(
        json.dumps(template, indent=2) + "\n"
    )


# ── Main ────────────────────────────────────────────────────────────────────

def main() -> int:
    picks = sample_stratified()
    write_eval_dir(picks)

    # Report
    by_bucket: dict[tuple[str, str], int] = defaultdict(int)
    for p in picks:
        by_bucket[(p.source, p.tier)] += 1

    print(f"Wrote eval set to {EVAL_ROOT}")
    print()
    print(f"  {'source':<8} {'short':>6} {'medium':>7} {'long':>5}  total")
    print(f"  {'-' * 36}")
    for src in ("claude", "codex", "cursor"):
        row = [src.ljust(8)]
        row.append(f"{by_bucket[(src, 'short')]:>6}")
        row.append(f"{by_bucket[(src, 'medium')]:>7}")
        row.append(f"{by_bucket[(src, 'long')]:>5}")
        total = sum(by_bucket[(src, t)] for t in ("short", "medium", "long"))
        row.append(f"  {total:>4}")
        print(f"  {''.join(row)}")
    print(f"  {'-' * 36}")
    print(f"  {'TOTAL':<8}{'':>6}{'':>7}{'':>5}  {len(picks):>4}")
    print()
    print(f"  Next: open {EVAL_ROOT}/ground-truth-template.json")
    print(f"        Read the _meta.instructions, then fill in fields per session.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
