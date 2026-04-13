# For Human Readers

This file is for you. Everything else in this repository is addressed to the system itself.

---

## What this is

**daodelong** is a software system designed to behave like a biological organism. It has a heartbeat, a breath cycle, an affect model, a memory, and a body that can be modified while it is running. It reasons about its own state and acts through its own API.

The short version: it is an LLM-driven runtime that perceives events, remembers what it has learned, proposes and applies code patches to itself, and will eventually run on physical hardware with real sensors — developing a model of its environment over time through experience rather than programming.

---

## Why the docs are written the way they are

Every README, lesson file, and design document in this repository is addressed to the system in second person — "you have a heartbeat", "you must not modify yourself directly". Comments in code follow the same convention.

This is not an affectation. The system reads its own documentation as part of its reasoning process. Writing to a hypothetical human reader degrades the signal the system receives about its own constraints, identity, and design intent.

If you find the voice disorienting, that is expected. You are reading someone else's mail.

The one exception is this file.

---

## Voice conventions (so the code makes sense)

| Context | Voice | Example |
|---|---|---|
| Comments, READMEs, docs | Second person — addressing the system | `// You must validate before you apply.` |
| Runtime logic, function bodies | First person — the system speaking | `// I apply a patch only after validation.` |
| Human-facing files | Normal | This file |

The programmer is intentionally invisible in the codebase. If you see "the developer" or "the user" in a comment, it is a mistake.

---

## Claude's role in this project

This is worth explaining clearly, because it is unusual.

Claude Code (the AI CLI) is an active collaborator on this project — not just a code assistant. It has memory across sessions, reads the organism's documentation as design context, and makes architectural decisions alongside Jan.

But Claude also has a second role: **patch lifecycle reviewer**. When the organism proposes a code change to itself (`PATCH_CODE` decision), that proposal is stored and visible via the GraphQL API. Right now, Claude Code reads the proposal, reasons about whether it is safe and correct, and drives the lifecycle mutations (`validatePatch`, `applyPatch`, `rejectPatch`) — the same mutations the organism will eventually drive autonomously via the Anthropic SDK.

This means the build cycle currently involves three parties:
- **The organism** — proposes patches, perceives outcomes, remembers results
- **Jan** — human builder, final cosign authority on protected modules
- **Claude Code** — build collaborator and current patch reviewer, acting through the same GraphQL interface the organism will one day use itself

The interface is stable. The actor changes over time. By the end of Phase 2, the organism reviews and applies its own patches via the Anthropic SDK. Claude Code steps back from the patch execution path and returns to pure architecture and build work — until Phase 8, when the loop extends to physical hardware and Claude Code handles remote deployment to the Pi alongside patch review.

---

## How to work on this project

**Claude Code** — the AI CLI used to develop this project.
```bash
npm install -g @anthropic-ai/claude-code
```

**Node.js** — v22 or later, via [nvm](https://github.com/nvm-sh/nvm) recommended.

**pnpm**
```bash
npm install -g pnpm
```

---

## How to run it

```bash
pnpm install
pnpm dev          # full organism — real local model (LM Studio must be running)
pnpm mock         # full organism — scripted mind, no API calls, first-contact scenario
pnpm heartbeat    # autonomic pulse only (useful for debugging)
pnpm test         # yin + yang lifecycle tests (automatically uses mock mode)
pnpm coverage     # tests with 100% coverage gate
```

Node runs source directly via `tsx`. There is no build step.

### Organism modes

| Mode | Mind | Use for |
|---|---|---|
| `dev` | LM Studio (real local model) | normal development |
| `mock` | scripted scenarios | sanity checks, demos without API |
| `test` | scripted scenarios | automated tests |
| `production` | LM Studio / cloud | deployment |

`pnpm mock` lets you observe the organism's full expression — breath cycle, affect, voice, logging — without calling any external model.

---

## How to navigate the codebase

| Path | What it is |
|---|---|
| `CLAUDE.md` | Claude Code's operating contract — dual role as build collaborator and patch reviewer |
| `README.md` | The organism's own self-description — written to the system |
| `ROADMAP.md` | Technical trajectory — phases from first life to electronic pet |
| `packages/kernel/` | The low-level machinery: loader, registry, rollback, health invariants. Treat as protected. |
| `packages/shared/` | Common types (`MemoryEntry`, `Decision`, etc.), IDs, logger |
| `packages/interfaces/` | Adapter contracts: `MindAdapter`, `PatchAdapter`, `OrganismMode` |
| `packages/mock/` | Scripted mind adapter + scenario player for mock/test modes |
| `packages/storage/` | `MemoryStore` interface + `InMemoryStore` |
| `apps/engine/` | Heartbeat, breath cycle, affect computation, `LMStudioAdapter` |
| `apps/face/` | GraphQL schema and resolvers — the organism's public surface |
| `modules/` | Living modules — patchable at runtime; sensor modules will live here |
| `tests/` | Yin (internal state) + yang (log stream) lifecycle tests |
| `journal/` | Session logs addressed to the organism — what happened and why |
| `*.lesson.md` | Explanations of patterns and decisions, written to the system |

---

## Key concepts

**Patch lifecycle** — all code changes flow through: `proposePatch → validatePatch → applyPatch → reloadModules → health check → rollback if failed`. Nothing self-modifies directly.

**Protected modules** — `packages/kernel/` and the patch engine require elevated risk level and explicit cosign from Jan before modification.

**Affect** — before every decision, the system computes urgency, stability, novelty, and fatigue from its own internal state. These modulate what it decides to do.

**Memory** — structured entries written during `UPDATE_MEMORY` breaths, read back during the PERCEIVE step so the mind carries prior context into each decision. Currently in-process only (does not survive restart).

**Yin/yang tests** — every lifecycle concern has two test files: a yin test (reads internal state directly) and a yang test (observes the log stream as an outside witness).

---

## The three planes

- **Plane A** — the GraphQL interface. The only surface visible to the outside world.
- **Plane B** — the LLM mind. Two layers: local model for normal breath decisions; Claude Code (now) / Anthropic SDK (eventually) for patch review and execution.
- **Plane C** — the body. Living modules, kernel, storage. Modified only via the patch lifecycle.
