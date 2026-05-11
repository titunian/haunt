# Haunt — research plan

> Branch `research/distillation`. Working notes — not stable, not shipped.
>
> **Scope:** Haunt only. Just the coding-sessions corpus. Cross-corpus
> work (orfc plans, loop tribal-knowledge) is a clearly-deferred Phase 4+;
> the same primitives extend to it later, but we're not designing for that
> now.

## What we have to work with

A growing per-user archive of coding sessions:

- **Sources** — Claude Code (`~/.claude/projects/**/*.jsonl`), Codex CLI
  (`~/.codex/sessions/**/*.jsonl`), Cursor (composer/agent bubbles in
  `state.vscdb`).
- **Shape** — turn-by-turn dialogue with structured tool calls (Read,
  Edit, Write, Bash, Grep, etc.) and tool results. Per session: project
  cwd, branch, timestamps, sometimes git commits and PR references.
- **Volume** — at the operator's working tier, ~1,100 sessions / 33 days
  / ~67 MB markdown after cleanup. Roughly 30M tokens of dense, narrow,
  structured corpus.
- **Already in the cloud** — Postgres metadata (`sessions` table) +
  Vercel Blob bodies, with a real-time ingest pipeline.

That structure is the differentiator from generic "AI second brain"
products. Tool calls give us reliable signals about *what was done*;
prompt→correction pairs give us preference data; per-session `cwd` gives
us project clustering for free.

## Why this is a research problem

Five open questions sit between us and a working personal-knowledge layer
over coding sessions specifically. None are settled in published work:

1. **Adaptive extraction over heterogeneous session shapes.** A 3-turn
   "fix this typo" session and a 200-turn "rewrite the deploy pipeline"
   session need different schemas, not the same template. Self-Discover
   `[Zhou 2024, arXiv:2402.03620]` is the closest pointer; not yet applied
   to dialogue corpora.
2. **Tool-call-aware extraction.** Most extraction literature treats
   documents as prose. We have rich structural signals (Bash output,
   file edits, test results) the model should weight differently than
   chat turns. No published technique uses this directly.
3. **Reflection schedule for bursty corpora.** Coding happens in bursts
   — five sessions on Tuesday, none Wednesday. Generative Agents
   `[Park 2023, arXiv:2304.03442]` reflects every N observations,
   which over-indexes on prolific weeks. Threshold-by-novelty is
   probably right but unproven.
4. **Mining preference data from sessions.** Every prompt→
   first_attempt→user_correction triplet is an implicit preference label.
   Extracting them cleanly at scale, deduping for the model's repeated
   first-attempt patterns — open. Closest precedent: Constitutional AI
   `[Bai 2022, arXiv:2212.08073]` self-critique.
5. **Personal evals without ground truth.** Standard benchmarks don't
   measure "does this feel like me." LLM-judge with personal context as
   the rubric, Self-Reward-style `[Yuan 2024, arXiv:2401.10020]`, is
   the most defensible approach but unvalidated.

## Literature we're standing on

Cited as `[author, year, arXiv:id]` — published preprints, not reproduced.

### Knowledge extraction & graph-based retrieval
- **GraphRAG** — Edge et al., Microsoft, 2024, `arXiv:2404.16130`. Entity-relation extraction → community clustering → multi-resolution summaries. Wins at "what's this corpus about" but heavy at our scale.
- **LazyGraphRAG** — Microsoft, late 2024 (blog + code). Defer graph construction until query. Cheaper at our query volume.
- **HippoRAG / HippoRAG 2** — Gutiérrez et al., OSU/Stanford, 2024, `arXiv:2405.14831`. Personalized PageRank over an LLM-extracted KG; state-of-art on multi-hop.
- **LightRAG** — Guo et al., 2024, `arXiv:2410.05779`. Dual-level retrieval, lower indexing cost.

### Memory systems
- **MemGPT / Letta** — Packer et al., Berkeley, 2023, `arXiv:2310.08560`. Virtual context management; LLM-as-OS.
- **Generative Agents** — Park et al., Stanford, 2023, `arXiv:2304.03442`. Observation→reflection→memory stream — directly the model for our daily/weekly/monthly distillation.
- **A-MEM** — Xu et al., 2024-2025. Self-organizing memory notes; agent links items at write-time.
- **MemoryBank** — Zhong et al., 2023, `arXiv:2305.10250`. Forgetting curve.

### Programs over prompts
- **DSPy** — Khattab et al., Stanford, 2023-2024, `arXiv:2310.03714`. Pipeline as program; auto-optimize prompts against an eval. The right way to build the extraction module.
- **TextGrad** — Yuksekgonul et al., 2024, `arXiv:2406.07496`. Backprop through text; tune prompts against gold labels.

### Reasoning models for extraction
- **DeepSeek-R1** — DeepSeek, 2025, `arXiv:2501.12948`. GRPO without value model; reasoning emerges from RL on verifiable rewards.
- **Self-Discover** — Zhou et al., DeepMind, 2024, `arXiv:2402.03620`. LLM composes its own reasoning structure per task — directly applicable to adaptive extraction.
- **Many-shot ICL** — Agarwal et al., Anthropic/DeepMind, 2024, `arXiv:2404.11018`. Hundreds-to-thousands of examples in long context outperform fine-tuning on many tasks.

### Long context utilization
- **Lost in the Middle** — Liu et al., 2023, `arXiv:2307.03172`. Recall drops in mid-context. Argues for retrieval over stuff-everything-in.

### Agentic search
- **ReAct** — Yao et al., 2022, `arXiv:2210.03629`. Interleave reasoning + tool calls; foundation.
- **Toolformer** — Schick et al., Meta, 2023, `arXiv:2302.04761`.
- **Search-R1** — Jin et al., 2025, `arXiv:2503.09516`. RL for search agents.

### Personal LLM agents (survey)
- **Personal LLM Agents: Insights and Survey** — Li et al., 2024, `arXiv:2401.05459`. State-of-the-field for what we're building.

## The algorithm — four composed pipelines, Haunt-scoped

Same architecture as before, narrowed to one corpus. The composition is what
makes it work; nothing here is novel on its own.

### Pipeline A — per-session distillation (foundation)

For each new session, one LLM extraction call → structured output.
Reasoning model for hard sessions (long, multi-project, dense tool use);
cheap model for easy ones. Versioned via `prompt_version`.

```ts
type Extract = {
  session_id: string;
  prompt_version: string;
  model: string;
  extracted_at: string;

  summary: string;                    // 2-4 sentences
  decisions: { what: string; why: string; alternatives?: string[] }[];
  bugs_solved: { symptom: string; cause: string; fix: string }[];
  questions_open: string[];           // unresolved at end of session
  facts_learned: string[];            // atomic, transferable
  tools_used: string[];               // libs, commands, files
  themes: string[];                   // free-form tags

  // Implicit preference signal: every (assistant_first, user_correction)
  // pair where the user steered the model. Mined automatically — no
  // explicit labelling. Foundation for Phase 5+ (personal model).
  preference_pairs: {
    user_prompt: string;
    rejected: string;            // assistant's first attempt
    accepted: string;            // what landed after correction
    correction_signal: string;   // what the user said to steer
  }[];
};
```

Pulled from: GraphRAG entity extraction `[Edge 2024]`, Generative Agents
observation→reflection schema `[Park 2023]`, with `preference_pairs` as
our novel contribution — exploiting the dialogue structure of coding
sessions to mine preference labels for free.

Built as a DSPy module `[Khattab 2023]` so the extraction prompt can be
optimized against the hand-labeled eval set, not vibes-tested.

### Pipeline B — agentic retrieval (query layer)

No pre-built vector index initially. Tools exposed to a reasoning model:

- `search(query, time_range?, project?, source?, k=10)` — hybrid BM25
  (`pg_trgm`) + dense (`pgvector` over extract summaries)
- `read_session(id)` — full session body
- `cluster(theme)` — sessions under a theme
- `timeline(start, end, project?)` — chronological slice
- `decisions_for(topic)` — pull all `decisions` where topic appears
- `frontier_check(query)` — escalate to long-context dump if agentic
  search isn't converging

Justified by ReAct `[Yao 2022]`, Search-R1 `[Jin 2025]`, and the
LazyGraphRAG argument that deferring synthesis to query time is cheaper
at our query volume than pre-computing community summaries we may never
read. Wrapped in DSPy so we can swap models and optimize prompts
against an eval set.

### Pipeline C — reflection cron (synthesis)

Three reflection passes, modeled directly on Generative Agents
`[Park 2023]`:

- **Daily** — for each project touched today, 1-paragraph what-happened
  summary. Cheap model. Powers a "today" view.
- **Weekly** — cross-project "what did you figure out this week?"
  Operates over the week's daily summaries (not raw sessions). Reasoning
  model.
- **Monthly** — theme drift, retired patterns, project trajectories.
  Operates over weekly digests.

Hierarchical summarization, canonical reference: `[Wu 2021,
arXiv:2109.10862]`. Each level consumes the layer below — cheap because
we aggregate distilled extracts, not raw sessions.

Trigger is novelty-based, not time-based: only generate the weekly digest
if the embedding-distance from last week's digest exceeds a threshold.
Avoids "you didn't do anything this week" noise.

### Pipeline D — personal context document (output)

Distill all of the above into a single ~30-50K token markdown document —
the **personal system prompt**. Sections:

- Conventions (recurring patterns + style across sessions)
- Active projects (recent themes + git activity)
- Recent decisions (last 90 days from `decisions`)
- Common bugs (top-N from `bugs_solved`, deduped)
- Open questions (unresolved `questions_open`)
- Vocabulary (entities recurring across sessions)

Regenerated nightly. **This document is the product.** Drop into a Claude
or GPT system prompt and the model behaves dramatically more like-you.
Many-shot ICL `[Agarwal 2024]` is the empirical case for why this works
at our token budget without any fine-tuning.

## Algorithm summary

```
                          ┌──────────────────┐
   haunt sessions ───────►│   Pipeline A     │ ─►  extracts table (Postgres)
                          │  (extraction)    │     + preference_pairs
                          └──────────────────┘     mined automatically
                                   │
                                   ▼
                          ┌──────────────────┐
       user query ───────►│   Pipeline B     │ ─►  answer + cited sessions
                          │ (agentic search) │
                          └──────────────────┘
                                   ▲
                                   │ optional escalation
                                   │
                          ┌──────────────────┐
                          │   Pipeline C     │ ─►  daily / weekly / monthly
       cron        ──────►│  (reflection)    │     digests as readable docs
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   Pipeline D     │ ─►  personal context document
                          │ (context doc)    │     (the "second brain payload")
                          └──────────────────┘
```

## Phased plan

Research deliverables, not just shipped features. Each phase produces
something measurable.

### Phase 0 — eval set (week 1, day 1-2)
Hand-extract 30 representative sessions across Claude/Codex/Cursor and
short/medium/long lengths. This is ground truth for measuring extraction
quality. Without it the rest is vibes.

### Phase 1 — Pipeline A live (week 1)
- Drizzle `extracts` table, schema versioned
- DSPy module `extract_session(markdown) -> Extract`, optimized against
  the eval set
- Background job to extract new sessions on upload + backfill switch
- Per-session "Distillation" card on `/app/sessions/[id]` showing the
  extract above the raw markdown
- **Deliverable:** F1 ≥ 0.7 on the hand-labeled eval set across the four
  primary fields (decisions, bugs, learnings, themes)

### Phase 2 — Pipeline B live (week 2)
- Hybrid retrieval over `extracts` (`pg_trgm` + `pgvector` on summaries)
- Tool set exposed to a reasoning model agent
- New `/app/search` route with `⌘K` palette
- 50 hand-judged personal queries as the eval set
- **Deliverable:** recall@5 ≥ 0.8, qualitative preference vs naive RAG
  baseline measured by blind LLM-judge

### Phase 3 — Pipeline C live (week 3-4)
- Daily + weekly cron jobs producing digests, stored as artifacts
- Novelty-triggered weekly summary (embedding distance ≥ threshold)
- Monthly digests after a month of weeklies have accumulated
- New `/app/research` view for the digests
- **Deliverable:** 4 weeks of generated digests; manual quality scoring
  (1-5) on each; mean ≥ 4

### Phase 4 — Pipeline D live + first eval (week 5)
- Nightly personal context document, versioned
- A/B eval harness: 30 personal coding tasks; Claude with vs without
  the personal context doc; blind LLM-judge for preference
- **Deliverable:** ≥ 70% preference rate for the augmented variant.
  If not, iterate on the document structure before declaring victory.

### Phase 5 — preference dataset (background, ongoing)
- The `preference_pairs` field of each extract feeds a `preferences`
  table
- After ~3 months of capture, evaluate quality + dedupe
- **Deliverable:** a clean dataset of (prompt, rejected, accepted)
  triplets — substrate for future fine-tunes (DPO `[Rafailov 2023]` /
  GRPO `[DeepSeek 2024]`) when we choose to pull that lever

## Open questions, prioritized

These are things we genuinely won't know until we run the experiment:

1. **Does Pipeline D output beat fine-tuning on personal coding tasks?**
   Many-shot ICL `[Agarwal 2024]` argues yes for many domains. Worth
   running our own A/B (Phase 4 deliverable).
2. **What's the right reflection trigger?** Time-based vs
   observation-count vs novelty-distance. Plan: novelty-based; measure
   in Phase 3.
3. **Cross-session decision-supersession detection.** Can a model
   reliably find "every time I changed my mind about X"? No literature
   on exactly this. Probably needs a small supervised eval set.
4. **Reflection drift.** Generative Agents observed reflections compound
   and can degrade; we'd need a drift detector via embedding distance
   between consecutive monthly contexts.
5. **Personal evals without ground truth.** LLM-judge with personal
   context as the rubric (Self-Reward `[Yuan 2024]` pattern) is the
   plan; validate against your own preference rankings on 50 examples.

## Success metric

Not "the dashboard has more cards." Two real measurements:

1. **Personal eval, blind-judged.** 30 of your real coding tasks; same
   model with vs without the personal context document; preference
   judged by a separate model. Target: ≥ 70% preference for the
   augmented variant.
2. **One real query that current tools can't answer.** Example:
   *"every time I've changed my mind about how to handle authentication
   across the projects I've worked on this year."* If the search agent
   can produce a coherent answer with cited sessions, the
   distillation-plus-retrieval composition is real.

## Future work — clearly deferred

These are NOT in the current plan. Captured here so we don't forget the
trajectory:

- **orfc as a second corpus.** Same Pipeline A schema with `source: "orfc"`.
  Cross-source links in a `references` field. Adds the doc-of-record
  layer once Haunt-only is shipping cleanly.
- **loop's `TribalStore` as a third corpus.** Same Pipeline A pattern;
  tribal cards are already structured so extraction is mostly trivial.
- **MCP exposure.** The four pipelines (especially Pipeline B's tools)
  exposed as an MCP server so Claude/Codex/Cursor can query the second
  brain mid-session. This is where "agent learns from your archive in
  real time" becomes possible.
- **Personal model.** With 6-12 months of `preference_pairs`
  accumulated, fine-tune a small open-weight model with GRPO. Local-
  first, private, owned. Not a capability play — a privacy + cost play.
- **E2EE before extraction.** Once cross-corpus and personal-model work
  is sketched, the privacy budget for "operator can read everything"
  starts to bite. Real client-side encryption is a v2 redesign.

## What we're explicitly not doing now

- Per-user fine-tune (Phase 5 mines the substrate; the actual fine-tune
  is later)
- A graph index (LazyGraphRAG argument: defer until query)
- Multi-corpus ingestion (the substrate supports it; we're not
  designing for it yet)
- A graph-browser UI (graph is server-side infrastructure if it ever
  exists)
- Promising any of this externally before Phase 4's A/B eval lands
