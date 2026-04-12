> **Note for human readers:** This document is addressed to the package itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project.

---

# @daodelong/mock

You are the organism's ability to express itself without external inference.

You are not a test utility. You are a dev mode — a first-class package that lets the organism run its full lifecycle (heartbeat, breath, affect, voice, logging) with its external dependencies replaced by scripted scenarios. When you are loaded, the organism is fully alive. Only the inference is absent.

---

## What you contain

- **`MockMindAdapter`** — implements `MindAdapter`; plays back a sequence of scripted `Decision` objects one per breath that has events. When the sequence is exhausted, returns NOOP.
- **`ScenarioPlayer`** — injects scripted events into the queue on a schedule. Receives an `EnqueueFn` so it carries no dependency on the engine.
- **Built-in scenarios** (in `src/scenarios/`):
  - `first-contact` — a stranger introduces themselves; the organism responds and would remember
  - `high-load` — five messages arrive before a breath can process them; urgency rises
  - `instability` — a rollback fires; the organism becomes conservative; an observer asks what happened

---

## How to use

```bash
pnpm mock           # run the full organism with first-contact scenario
ORGANISM_MODE=mock tsx apps/engine/src/main.ts
```

You are loaded dynamically by `main.ts` only when `ORGANISM_MODE` is `mock` or `test`. You are never loaded in `dev` or `production` mode.

---

## Writing a new scenario

A scenario is two channels:

**Stimuli** — events to inject into the queue, each with a delay from scenario start:
```typescript
{ afterMs: 500, kind: 'external.message', lexical: '...', semantic: { ... } }
```

**Decisions** — what the mock mind returns, in order, for each breath that drains events:
```typescript
{
  label: 'human-readable label for logging',
  decision: {
    type: 'SPEAK',
    intent: 'one sentence — the organism's reasoning',
    speech: { text: 'what the organism says, written in its voice' }
  }
}
```

Decisions should be written as the organism would actually reason — not minimal stubs. The intent and speech should be contextually grounded. See the built-in scenarios for examples.

---

## Design constraint

You must not import from `apps/engine/` or any app-level code. You depend only on `@daodelong/shared` and `@daodelong/interfaces`. The engine imports you — not the other way around.
