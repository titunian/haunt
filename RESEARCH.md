# Cross-Corpus Personal Context — research plan

> Branch `research/distillation`. Working notes — not stable, not shipped.

## What we already have

Three independently-built capture systems, each producing a different shape
of personal/team artifact:

| System | Corpus | Granularity | What's already there |
|---|---|---|---|
| **haunt** (`Documents/GitHub/haunt`, `~/.claude/haunt`) | Coding sessions across Claude Code, Codex CLI, Cursor | Per-conversation markdown | Real-time capture, watcher daemon, Postgres + Blob backend, web dashboard |
| **orfc** (`Documents/GitHub/rfc`) | Agent-written plans / RFCs / migration designs reviewed by humans | Per-document with versioned comment threads | CLI (`push`, `pull`), web viewer, inline comments anchored to text snippets, version history |
| **loop** (`Documents/GitHub/pavo/loop`) | Workspace data context — connectors, datasets, schema decisions | `AGENT.md` files, tribal-knowledge scans, Pavo `AskTribalKnowledge` | `TribalStore` / `TribalSource` / `LocalTribalSource` / `TribalFile`, ingestion pipeline, registry, query API |

The architectural primitives exist. The unsolved problem is **composing them
into one personal context surface that is queryable, reflective, and
actionable** — without each system needing to know about the others.

## Why this is a research problem (not a product engineering problem)

The "second brain over a private multi-corpus" use case sits at the intersection
of several open problems in the literature:

1. **Schema-free knowledge integration across heterogeneous sources.** Each
   corpus has its own structure (turn-by-turn dialogue vs versioned doc with
   anchored comments vs key-value tribal cards). Existing fusion techniques
   (entity resolution, ontology alignment) assume cleaner schemas than we have.
2. **Continual personalization without weight updates.** Frontier-lab consensus
   has shifted to memory-and-context approaches over per-user fine-tuning, but
   the algorithms for *what to keep in memory*, *when to consolidate*, and
   *how to retrieve hierarchically* remain unsettled.
3. **Reflective synthesis at multiple time scales.** Generative-Agents-style
   reflection works for single-stream observations, but no published technique
   robustly handles "produce a coherent quarterly narrative from
   coding-sessions + reviewed-plans + tribal-knowledge updates."
4. **Personal evaluation harnesses.** Whether a context-augmented model is
   actually closer to "you" than the base — open empirical question. No
   canonical benchmark.
5. **Privacy-preserving extraction at the operator layer.** Once distilled,
   the extracts are *more* sensitive than the raw text. E2EE on extracts is
   open; nothing canonical exists.

We don't need to solve these. We need to make principled architectural choices
and cite the literature we're standing on.

## The literature we're standing on

Cited as `[author, year, arXiv:id]` — published preprints, not reproduced.

### Knowledge extraction & graph-based retrieval

- **GraphRAG** — Edge et al., Microsoft, 2024, `arXiv:2404.16130`. Entity-
  relation extraction → Leiden community clustering → multi-resolution
  community summaries. Strong on global "sense-making" queries; weak ROI at
  small corpora.
- **LazyGraphRAG** — Microsoft, late 2024 (blog + code). Defer graph
  construction until query time; use a router LLM to decide when global
  synthesis is needed vs vanilla retrieval. Cheaper at low query volume —
  matches our scale.
- **HippoRAG / HippoRAG 2** — Gutiérrez et al., OSU/Stanford, 2024,
  `arXiv:2405.14831`. Personalized PageRank over an LLM-extracted KG,
  fused with dense retrieval. State-of-art on multi-hop questions.
- **LightRAG** — Guo et al., 2024, `arXiv:2410.05779`. Dual-level (entity +
  relation) retrieval over an LLM-extracted graph. Lower indexing cost than
  GraphRAG, comparable quality on local queries.

### Memory systems for LLM agents

- **MemGPT / Letta** — Packer et al., Berkeley, 2023, `arXiv:2310.08560`.
  Virtual context management; LLM-as-OS with paged main + recall memory.
  The conceptual frame for "what stays hot vs cold" in a personal context.
- **Generative Agents** — Park et al., Stanford, 2023, `arXiv:2304.03442`.
  Observation stream → periodic reflection passes → high-level beliefs.
  The reflection schedule is what we'd port to "weekly digest" / "monthly
  themes" / "quarterly trajectory."
- **A-MEM (Agentic Memory)** — Xu et al., 2024-2025. Self-organizing memory
  notes inspired by the Zettelkasten method; the agent links memory items at
  write-time. Useful framing for cross-corpus links (a session links to an
  orfc plan it was implementing, etc.).
- **MemoryBank** — Zhong et al., 2023, `arXiv:2305.10250`. Forgetting curve
  inspired by Ebbinghaus; useful for tribal-knowledge retention.

### Programs over prompts

- **DSPy** — Khattab et al., Stanford, 2023-2024, `arXiv:2310.03714`. Treat
  pipelines as differentiable programs; auto-optimize prompts against an
  eval. We should structure the extraction pipeline as DSPy modules so
  prompt updates are evaluated, not vibes-tested.
- **TextGrad** — Yuksekgonul et al., 2024, `arXiv:2406.07496`. Backprop
  through text; useful for tuning extraction prompts against gold labels.
- **The Shift from Models to Compound AI Systems** — Berkeley AI, 2024
  (blog post by Zaharia, Khattab, et al.). The architectural argument
  for why our extraction pipeline should be modular, not a single mega-prompt.

### Reasoning models for extraction

- **DeepSeek-R1 / R1-Zero** — DeepSeek, 2025. GRPO without value model;
  reasoning emerges from RL on verifiable rewards. The extraction pipeline
  should use a reasoning model for the hard parts (decision detection,
  multi-hop reference resolution) where chain-of-thought materially helps.
- **Many-shot in-context learning** — Agarwal et al., Anthropic/DeepMind,
  2024, `arXiv:2404.11018`. Hundreds-to-thousands of examples in long
  context outperform fine-tuning on many tasks. Argues against per-user
  fine-tunes for our use case.
- **Self-Discover** — Zhou et al., Google DeepMind, 2024, `arXiv:2402.03620`.
  LLM composes its own reasoning structure per task. Useful for adaptive
  extraction (let the model decide what's notable in *this* session).

### Personalization & preference learning

- **Direct Preference Optimization (DPO)** — Rafailov et al., Stanford,
  2023, `arXiv:2305.18290`. The default for preference fine-tuning until
  ~late 2024.
- **GRPO** — DeepSeek, 2024 (in DeepSeek-R1 paper, `arXiv:2501.12948`).
  Group-relative policy optimization; no value model. Becomes interesting
  for personal models when we have enough preference pairs.
- **Self-Reward** — Yuan et al., Meta, 2024, `arXiv:2401.10020`. Same model
  generates and critiques; bootstraps preference data without humans. Plausible
  source of synthetic preference labels from the haunt archive.
- **Constitutional AI** — Bai et al., Anthropic, 2022, `arXiv:2212.08073`.
  Model self-critiques against a written "constitution." For personal
  context, the constitution would be derived from tribal knowledge.

### Long-context utilization

- **Lost in the Middle** — Liu et al., 2023, `arXiv:2307.03172`. Recall
  drops in the middle of long context. Argues for retrieval over
  stuff-everything-in even with 1M+ windows.
- **Many-shot ICL** (cited above) — argues the opposite for some tasks.
  The right answer is task-dependent.

### Agentic search

- **ReAct** — Yao et al., 2022, `arXiv:2210.03629`. Interleave reasoning
  and tool calls; foundation of all agentic search.
- **Toolformer** — Schick et al., Meta, 2023, `arXiv:2302.04761`. Model
  learns when to call tools.
- **Search-R1** — Jin et al., 2025, `arXiv:2503.09516`. RL-trained search
  agents; relevant if we ever want to optimize the agentic search loop
  end-to-end.

### Personal LLM agents (the survey)

- **Personal LLM Agents: Insights and Survey about the Capability,
  Efficiency and Security** — Li et al., 2024, `arXiv:2401.05459`. The
  closest thing to a state-of-the-field survey for what we're building.
  Worth reading before any architectural choice.

## The algorithm — three composed pipelines

We're not inventing a new algorithm. We're composing four existing ones into
a pipeline tuned for the multi-corpus personal-context setting.

### Pipeline A — per-artifact distillation (foundation layer)

For each new artifact (haunt session, orfc doc revision, loop AGENT.md
update), run a **single LLM extraction call** producing a stable structured
output. Use a reasoning model for hard cases (orfc plan with embedded code +
threaded comments) and a cheap model for easy cases (a 3-turn coding
session).

Schema (versioned via `prompt_version`):

```ts
type Extract = {
  source: "haunt" | "orfc" | "loop";
  artifact_id: string;
  ts: string;
  summary: string;                    // 2-4 sentences
  decisions: { what: string; why: string; alternatives?: string[] }[];
  bugs_solved: { symptom: string; cause: string; fix: string }[];
  questions_open: string[];           // unresolved at end of artifact
  facts_learned: string[];            // atomic, transferable
  references: {                       // links to other artifacts
    kind: "session" | "orfc_doc" | "tribal" | "url" | "file" | "repo";
    id: string;
    relation: "implements" | "supersedes" | "references" | "blocked_by"
  }[];
  entities: { kind: string; name: string }[];  // for graph layer
  themes: string[];                   // free-form tags
};
```

Pulled from: GraphRAG entity extraction `[Edge 2024]`, Generative Agents
observation→reflection schema `[Park 2023]`, A-MEM linking
`[Xu 2024]`, with `references` capturing cross-corpus edges (orfc doc
implements decision from haunt session N, loop AGENT.md cites tribal fact M).

### Pipeline B — agentic retrieval (query layer)

No pre-built vector index. Tools exposed to a reasoning model:

- `search(corpus, query, time_range?, project?, k=10)` — hybrid BM25 + dense
- `read_artifact(corpus, id)` — full artifact body
- `neighbors(corpus, id, hops=1)` — graph-walk via `references`
- `cluster(theme)` — return all artifacts under a theme
- `timeline(start, end, project?)` — chronological slice
- `frontier_check(query)` — escalate to long-context dump if agentic
  search isn't converging

The retrieval agent decides which tools to call. Justified by ReAct
`[Yao 2022]`, Search-R1 `[Jin 2025]`, and the LazyGraphRAG argument that
deferring synthesis to query time is cheaper than pre-computing community
summaries we may never read.

For implementation: DSPy `[Khattab 2023]` modules so we can swap models and
optimize prompts against an eval set without prose-rewrites.

### Pipeline C — reflection cron (synthesis layer)

Three reflection passes, modeled directly on Generative Agents
`[Park 2023]`:

- **Daily** — for each project touched today, generate a 1-paragraph
  what-happened summary. Cheap model. Powers the dashboard's "today" view.
- **Weekly** — cross-project "what did you figure out this week?" Operates
  over the week's daily summaries (not raw artifacts). Reasoning model.
- **Monthly / quarterly** — theme drift, retired patterns, project
  trajectories. Operates over weekly digests. Output goes to orfc as a
  reviewable doc — closing the loop, since tribal knowledge gets *back into*
  the doc-of-record.

Reflection consumes the output of the layer below — the literature calls
this "hierarchical summarization for long documents," with `[Wu 2021]`
(arXiv:2109.10862) being the canonical reference.

### Pipeline D — personal context document (output layer)

Distill all of the above into a single ~30-50K token markdown document —
the "personal system prompt." Sections:

- Conventions (extracted from recurring patterns + AGENT.md files)
- Active projects (extracted from recent themes + git activity)
- Recent decisions (last 90 days of `decisions` from extracts)
- Common bugs (top-N from `bugs_solved`, deduped)
- Open questions (unresolved `questions_open` across artifacts)
- Vocabulary (entity names recurring across corpora)

Regenerated nightly from the layers above. **This document is the product.**
Drop into a Claude/GPT system prompt and the model behaves dramatically
more like-you. Many-shot ICL `[Agarwal 2024]` is the empirical case for
why this works at our token budget without any fine-tuning.

## Algorithm summary

```
                       ┌──────────────────┐
   haunt sessions ───► │                  │
                       │   Pipeline A     │  ─►  extracts table (Postgres)
   orfc docs     ───► │   (extraction)   │       references = cross-corpus edges
                       │                  │
   loop tribal   ───► │                  │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
       user query ───► │   Pipeline B     │ ─►  answer + cited artifacts
                       │ (agentic search) │
                       └──────────────────┘
                                ▲
                                │ optional escalation
                                │
                       ┌──────────────────┐
                       │   Pipeline C     │ ─►  daily/weekly/monthly digests
       cron        ───►│  (reflection)    │     posted to orfc as docs
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Pipeline D     │ ─►  personal context document
                       │ (context doc)    │     (the "second brain payload")
                       └──────────────────┘
```

## Open research questions, prioritized

These are things we'd genuinely *not know* until we run the experiment:

1. **Does `Pipeline D` output beat fine-tuning on personal tasks?** Open
   empirical question; cleanest answer in many-shot ICL `[Agarwal 2024]` is
   "frequently yes." Worth running: same task, frontier model + 50K personal
   context vs same model fine-tuned on the same corpus. Personal eval set
   needed.
2. **What's the right reflection schedule?** Generative Agents `[Park 2023]`
   reflects every N observations. Our equivalent might be every N artifacts,
   or time-based, or threshold-based on novel-content detection. No
   canonical answer.
3. **Cross-corpus link extraction quality.** Can a model reliably detect
   "this haunt session is implementing this orfc plan"? No literature on
   exactly this — closest is entity-linking work over heterogeneous corpora
   (DBpedia spotlight era). Probably needs supervised eval.
4. **Reflection drift over time.** Generative Agents observed reflections
   compound; quality can degrade if low-signal observations dominate. We'd
   need a drift detector — possibly via embedding-distance between
   month-N and month-N+1 personal context documents.
5. **Personal evals without ground truth.** Standard LLM evals don't measure
   "does this feel like me?" Possible approach: LLM-judge with the personal
   context as the rubric. Self-Reward `[Yuan 2024]` pattern, but for
   personalization rather than capability.

## Plan

Phased, with research deliverables (not just shipped features):

### Phase 0 — wire the substrate (week 1)
- Drizzle `extracts` table (the schema above) with `source` discriminator
- DSPy module for `extract_session(markdown) -> Extract` — Pipeline A for haunt
- Manual eval set: 30 sessions hand-extracted as ground truth
- Test extraction quality, iterate prompt, freeze `prompt_version=v1`

### Phase 1 — second source: orfc plans (week 2)
- `orfc list` + `orfc pull` integration; treat each doc revision as an artifact
- DSPy module `extract_orfc(doc, comments) -> Extract`
- Cross-corpus link detection: when a haunt session mentions an orfc slug, populate `references`
- First eval: precision/recall of cross-corpus links on hand-labeled set

### Phase 2 — third source: loop tribal-knowledge (week 3)
- Scan `loop_memory/tribal` directories, ingest each `TribalFile` as an artifact
- Pipeline A on tribal artifacts (mostly trivial — they're already structured)
- Cross-corpus links: tribal facts ↔ haunt sessions that mention the entities
- Now we have a unified `extracts` table populated from all three corpora

### Phase 3 — agentic retrieval (week 4)
- Implement the tool set from Pipeline B
- Wrap in a DSPy retrieval program with optimized prompts
- Eval: 50 personal queries with hand-judged correct artifacts; measure
  recall@5 and answer quality vs naive RAG baseline

### Phase 4 — reflection (week 5-6)
- Daily/weekly/monthly cron jobs
- Weekly digests posted to orfc as reviewable docs
- The output of reflection re-enters Pipeline A as new artifacts (recursion)

### Phase 5 — personal context document (week 6-7)
- Pipeline D nightly job, output stored as a versioned artifact
- A/B eval: same task, frontier model with vs without the document. Measure
  preference rate via blind judge (Self-Reward pattern).

### Phase 6 — research writeup
- Document what worked, what didn't, where the literature was wrong
- Open questions list updated
- Decide whether to publish or stay internal

## What success looks like

Not "the dashboard has more cards." Two concrete measurements:

1. **Personal eval harness, scored by you.** Pick 30 tasks you actually do
   (debug X, draft a PR for Y, decide between Z and W). Score base model vs
   base model + personal context document on each. Target: > 70% preference
   for the augmented variant in a blind comparison.
2. **One real cross-corpus query that current tools can't answer.** Example:
   "Show me every time I changed my mind about how to handle X" — this
   requires linking decisions across haunt sessions and superseding orfc
   plans. If we can answer this, the composition is real.

## What we're explicitly not doing

- Not building a per-user fine-tune. Many-shot ICL + personal context doc
  has the better cost/quality curve at our scale today.
- Not building a vector DB as primary infrastructure. Hybrid search on
  Postgres `pg_trgm` + `pgvector` is enough until proven otherwise.
- Not building a UI for browsing the graph. The graph is server-side
  infrastructure; the user-facing surfaces are search, digests, and the
  context document.
- Not promising E2EE before extraction. The extracts are sensitive but
  encrypting them blocks the synthesis step. Privacy is a v2 problem,
  scoped here only enough to flag it.
