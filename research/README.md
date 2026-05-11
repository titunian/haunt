# research/

Code + tooling for the Haunt distillation research track. Plan lives in
[`../RESEARCH.md`](../RESEARCH.md).

## Layout

```
research/
  README.md            you are here
  sample_eval.py       Phase 0 — stratified sampler for the ground-truth set
```

Future modules (per the plan):

```
  extract.py           Phase 1 — Pipeline A: per-session distillation (DSPy)
  retrieve.py          Phase 2 — Pipeline B: agentic retrieval tools
  reflect.py           Phase 3 — Pipeline C: daily/weekly/monthly cron
  context_doc.py       Phase 4 — Pipeline D: personal context document
```

## The eval set is not in this repo

Hand-labeled session content stays private. The sampler writes to
`~/.claude/haunt/eval/`, which sits outside the repo and never gets
committed. Structure on disk after running:

```
~/.claude/haunt/eval/
  sessions/                       30 markdown sessions, stratified
  ground-truth-template.json      one entry per session, fields empty
  index.json                      sampler metadata (paths, sizes, tiers)
```

## Phase 0 — sampling

```bash
python3 research/sample_eval.py
```

Pulls a stratified sample from `~/Documents/claude-logs/`:

| Source | Short (<5 KB) | Medium (5–30 KB) | Long (>30 KB) | Total |
|---|---|---|---|---|
| Claude  | 5 | 5 | 4 | 14 |
| Cursor  | 4 | 4 | 4 | 12 |
| Codex   | — | 1 | 3 |  4 |

Codex takes all four available in the local archive (current corpus is
Claude-heavy; this will balance as Codex usage grows).

Bump `SEED` in the script to draw a fresh sample.

## Next, by hand

Open `~/.claude/haunt/eval/ground-truth-template.json`. The `_meta.instructions`
field at the top is the labelling guide. Fill in `summary`, `decisions`,
`bugs_solved`, `questions_open`, `facts_learned`, `tools_used`, `themes`
for each of the 30 sessions based **only** on the markdown body. Save.

The Phase 1 extractor will run against these as the gold set with F1
computed per field.
