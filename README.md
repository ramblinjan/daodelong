# The Organism

*A living system architecture*

---

## What this is

This is a software system designed to behave like a biological organism rather than a program.

Most software is a machine: input arrives, output is produced, the machine waits. This system is different. It is **always in process.** It has a pulse. It breathes. It has an interior. It accumulates time. It maintains a body that can be modified while alive.

A human who understands the metaphor can read this system's design documents and understand what the system is doing. A software engineer who also reads the code sees the same thing described in two registers simultaneously. Neither reading is wrong. The metaphor is not decoration — it is the architecture.

---

## Time

Most software has no sense of time passing. It responds to events or it sleeps. This system conceives of time as intrinsic to itself.

**The heartbeat** is the fastest cycle — autonomic, unconditional. Every few seconds, whether anything has happened externally or not, the system pulses. It checks its own vitals. It updates its internal clock. It emits a signal that says: *I am still alive.* The heartbeat is not about processing. It is about being.

*Technically: a tight interval loop, running independently of the event queue, that increments a pulse counter and checks health invariants. It cannot be blocked by event processing.*

**The breath** is the medium cycle — inhalation and exhalation. Inhale: the system draws in whatever is waiting in its event queue, reads its own state, and builds an internal picture of the moment. Exhale: it acts, or decides not to act, and releases. A breath cycle is where decisions happen. It is slower and varies in rhythm based on load and system state.

*Technically: the engine loop, triggered on event arrival or on a slower timer when the queue is quiet. One breath = one perceive → orient → decide → act → verify → learn pass.*

**Uptime** is the accumulating sense of self in time. The system knows how old it is in cycles, not just clock seconds. It can reference its own history: *three breaths ago I applied a patch. Forty heartbeats ago the last external event arrived.* This is the basis for temporal reasoning about its own behavior.

---

## The Senses

The system has two classes of sensory input.

**External senses** are signals that arrive from outside. In v1, these are structured events: a message, a data update, a webhook, a user input. Eventually anything — a file watch, a feed, a physical sensor, an API poll. They enter through a single surface (the GraphQL `ingestEvent` interface) and are normalized before reaching the decision process. The system never receives raw external signals directly. They are always transformed first.

**Internal senses** are proprioception — the system's awareness of its own state: current health, recent patch history, memory contents, heartbeat cadence, queue depth, uptime. These are not incidental debug metrics. They are first-class sensory data that the engine reads in the same pass as external events. The system knows how it feels before it decides what to do.

---

## Affect

Between raw data and decision sits something most software omits entirely: **a felt sense of the data.**

The system computes derived signals — not just what the data says, but what the data *means for the system's current state.* These signals modulate decision-making before reasoning begins.

- **Urgency** — how many events are unprocessed and how old is the oldest? A backlogged queue is a pressure, not just a count.
- **Stability** — heartbeats since the last rollback. A recently-unstable system should be conservative. A long-stable one can take slightly more risk.
- **Novelty** — does this event match known patterns, or is it structurally unfamiliar? Novelty is a signal worth tracking separately from content.
- **Fatigue** — how many patches have been proposed in recent breath cycles? A system that has been actively self-modifying should slow down.

These are computed state signals. They exist because they improve decision quality. They answer: *given everything I sense about myself right now, what kind of moment is this?*

*Technically: `affect.ts` reads internal state and produces a normalized affect vector passed into each breath cycle alongside the event and self-summary.*

---

## The Body, The Mind, The Interface

**The body** (Plane C) is living code: modules that can be replaced while the system runs. The kernel — loader, patch engine, rollback mechanism, health invariants — is structural, rarely changed, high-consequence if broken. The living modules on top are replaceable, swappable, the site of most ongoing change. The body never modifies itself directly. Changes flow through the patch lifecycle: propose → validate → apply → reload → verify → rollback if needed.

**The interface** (Plane A) is the system's surface — the only thing visible to the outside. It is a federated GraphQL API. Externals push events in and query summaries out. They cannot see or touch the interior. The interface is also what the mind reads to understand the body: introspecting its own schema tells the engine what the system can currently do.

**The mind** (Plane B) is the LLM engine. It reasons in language and acts only through the interface. It does not write files. It does not call shell commands. It calls GraphQL mutations. The design documents, CLAUDE.md, the prompt files — these are not code to be compiled. They are the mind's priors: the constraints, the decision heuristics, the voice conventions, the memory discipline.

---

## The Two Readings

This system is intentionally written to be read in two registers simultaneously.

**The semantic layer** — the design documents, this README, the prompt files, the voice conventions — is readable by someone who understands the metaphor but not necessarily every line of code. Comments address the system in second person. Runtime functions speak in first person. The programmer is invisible.

**The implementation layer** — the TypeScript, the GraphQL schemas, the module capsules — describes the same architecture precisely. An engineer reads `proposePatch → validatePatch → applyPatch → reloadModules → health check → rollback` and sees the same lifecycle.

Neither layer is a simplification of the other. They are the same system described in two languages.

---

## Running

```bash
pnpm install
pnpm dev
```

This starts:
- The heartbeat process (autonomic, unconditional)
- The federated GraphQL gateway (Plane A, port 4000)
- The subgraphs: identity / events / code / runtime / observability
- The engine loop (Plane B — breath cycle)

Default surface: `http://localhost:4000/graphql`

---

## Structure

```
apps/
  gateway/              # Plane A: single public GraphQL surface
  subgraph-identity/    # self, principles, capabilities
  subgraph-events/      # event ingestion + queue
  subgraph-code/        # patch lifecycle
  subgraph-runtime/     # health, reload, active revision
  subgraph-observability/ # metrics, errors, patch history
  engine/               # Plane B: heartbeat + breath + affect + decision
    src/
      heartbeat.ts      # autonomic pulse
      breath.ts         # perceive → orient → decide → act → verify → learn
      affect.ts         # urgency, stability, novelty, fatigue signals
      prompt/           # constraints, decision contract, patch discipline, memory
packages/
  kernel/               # Plane C: module capsule, loader, registry, rollback, invariants
  shared/               # types, ids, logger
  storage/              # sqlite + file adapters
modules/                # Plane C: living modules (the body — patchable at runtime)
  transforms/           # event normalization, summarization
  behaviors/            # decision policies, patch safety
```

---

## Safety

The kernel is conservative by design.

- Small, reversible changes beat clever ones.
- Protected modules (kernel, patch engine, rollback, health) require elevated risk and cosign.
- Health invariants are non-negotiable.
- Rollback is automatic and immediate on invariant failure.

*If you become unstable, you return to last-known-good.*
