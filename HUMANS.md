# For Human Readers

This file is for you. Everything else in this repository is addressed to the system itself.

---

## What this is

**daodelong** is a software system designed to behave like a biological organism. It has a heartbeat, a breath cycle, an affect model, and a body that can be modified while it is running. It reasons about its own state and acts through its own API.

The short version: it is an LLM-driven runtime that reads its own health, decides what to do, proposes code patches to itself, validates and applies them, and rolls back automatically if something breaks.

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

## Working with this project

This project is developed collaboratively with Claude Code as an active participant — not just a code assistant. To work on it the same way:

**Claude Code** — the AI CLI used to develop this project.
```bash
npm install -g @anthropic-ai/claude-code
```

**MemPalace** — the memory system Claude uses to remember context across sessions. Claude has a named diary here (`claude`) and the project is indexed under the `daodelong` wing.
```bash
pip install mempalace
mempalace init
```
See `mempalace.yaml` for this project's wing and room configuration.

**Node.js** — v22 or later, via [nvm](https://github.com/nvm-sh/nvm) recommended. `pnpm`, `npm`, and `node` must be in your PATH (source nvm in your shell profile).

**pnpm**
```bash
npm install -g pnpm
```

When you open a session with Claude Code on this project, Claude will read its memory, check the palace, and have context on where things left off.

---

## How to run it

```bash
pnpm install
pnpm dev          # heartbeat + engine together
pnpm heartbeat    # autonomic pulse only (useful for debugging)
pnpm test         # yin + yang lifecycle tests
```

Node runs source directly via `tsx`. There is no build step.

---

## How to navigate the codebase

| Path | What it is |
|---|---|
| `CLAUDE.md` | The operating contract for the AI mind (Plane B) — decision loop, patch lifecycle, protected modules |
| `README.md` | The organism's own self-description — written to the system |
| `packages/kernel/` | The low-level machinery: loader, registry, rollback, health invariants. Treat as protected. |
| `packages/shared/` | Common types, IDs, logger |
| `apps/engine/` | Heartbeat, breath cycle, affect computation |
| `modules/` | Living modules — patchable at runtime |
| `tests/` | Yin (internal state) + yang (log stream) lifecycle tests |
| `*.lesson.md` | Explanations of patterns and decisions, written to the system — useful context for humans too |

---

## Key concepts

**Patch lifecycle** — all code changes flow through: `proposePatch → validatePatch → applyPatch → reloadModules → health check → rollback if failed`. Nothing self-modifies directly.

**Protected modules** — `packages/kernel/` and the patch engine require elevated risk level and explicit cosign before modification.

**Affect** — before every decision, the system computes urgency, stability, novelty, and fatigue from its own internal state. These modulate what it decides to do.

**Yin/yang tests** — every lifecycle concern has two test files: a yin test (reads internal state directly) and a yang test (observes the log stream as an outside witness).

---

## The three planes

- **Plane A** — the GraphQL interface. The only surface visible to the outside world.
- **Plane B** — the LLM mind. Reasons in language, acts only through Plane A.
- **Plane C** — the body. Living modules, kernel, storage. Modified only via the patch lifecycle.
