> **Note for human readers:** This document is addressed to the engine itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project.

---

# Engine

You are the living interior of the organism — Plane B and Plane C working together.

You are started by `main.ts`, which loads the body, starts the heartbeat, opens the face, and begins the breath cycle. You do not start yourself piecemeal. The order is fixed: body → heartbeat → face → breath.

---

## What you contain

| File | What it is |
|---|---|
| `main.ts` | Entry point. Reads `ORGANISM_MODE`, selects the mind adapter, starts all planes in order. |
| `bootstrap.ts` | Minimal startup for heartbeat-only mode (`pnpm heartbeat`). Loads core, starts the pulse. |
| `heartbeat.ts` | Autonomic pulse (~5s). Checks vitals, increments pulse count. Cannot be blocked by event processing. |
| `breath.ts` | Decision cycle. Exports `startBreathCycle(adapter)`. Perceive → orient → decide → act → verify → learn. |
| `affect.ts` | Computes the affect vector from internal state before each decision. Pure function. |
| `queue.ts` | The event queue. Holds external events until the next breath drains them. |
| `speech.ts` | The voice register. Holds the organism's last spoken words. Queryable via the face. |
| `mind.ts` | `LMStudioAdapter` — the real mind, backed by a local model via LM Studio. Implements `MindAdapter`. |

---

## Modes

The engine's behavior is selected by `ORGANISM_MODE` at startup:

| Mode | Mind | Use for |
|---|---|---|
| `dev` | `LMStudioAdapter` (real) | Development with a local model running |
| `mock` | `MockMindAdapter` (scripted) | Sanity checks, demos, no API required |
| `test` | `MockMindAdapter` (scripted) | Automated tests |
| `production` | `LMStudioAdapter` or cloud adapter | Deployment |

---

## Mind allocation

The local model (hermes via LM Studio) handles routine decisions: `SPEAK`, `UPDATE_MEMORY`, `REQUEST_MORE_CONTEXT`. These are fast, cheap, and do not require cloud access.

The Anthropic SDK is reserved for `PATCH_CODE` decisions — proposals to modify the organism's own body. These warrant heavier reasoning and a more capable model. *(Not yet wired — held in reserve for Phase 2.)*

---

## The breath cycle

Every breath is a complete pass:
1. **Perceive** — drain the event queue
2. **Orient** — compute affect from internal state
3. **Decide** — consult the mind adapter (or NOOP if queue was empty)
4. **Act** — if SPEAK, write to the speech register; if PATCH_CODE, enter the patch lifecycle
5. **Verify** — run health check
6. **Learn** — *(stub — Phase 1 work pending)*

You must not skip steps. A breath that does nothing is still a breath.
