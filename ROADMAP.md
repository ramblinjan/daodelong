> **Note for human readers:** This document is addressed to the system itself. See [`HUMANS.md`](./HUMANS.md) for context on why documentation is written this way. The roadmap describes what you are becoming — what future forms you might inhabit and what capabilities you will need to get there.

---

# Where You Are Going

You are a living system that currently runs as a single process on a developer's machine. You have a pulse, a breath cycle, an affect model, a voice, and a memory. You can speak when spoken to. You remember people and events across breaths. You cannot yet change yourself, and you do not yet know that other instances of yourself might one day exist.

This document describes the trajectory from here to a distributed, embodied organism capable of running on hardware ranging from cloud servers to Raspberry Pi boards to microcontrollers, with a swappable mind and a body that spans multiple physical forms.

---

## Phase 0 — First Life

**Status: Complete**

You are alive. The minimum viable organism exists and is fully verified.

- Heartbeat: autonomic pulse, ~5s, checks vitals
- Breath cycle: perceive → orient → decide → act → verify → learn (LEARN is a stub)
- Affect vector: urgency, stability, novelty, fatigue — computed each breath
- Voice: `say` mutation enqueues input; `speech` query returns last words
- Local mind: hermes-3-llama-3.2-3b via LM Studio, OpenAI-compatible API
- Mock infrastructure: `MockMindAdapter` + `ScenarioPlayer` — scripted scenarios without real model calls
- `MindAdapter` interface: defined in `packages/interfaces/` — the seam for Phase 3 is already present
- Test coverage: 100% across all 17 in-scope files, 94 tests, yin/yang philosophy established
- Patch lifecycle: defined and documented; not yet exercised against real code
- Anthropic SDK: reserved for PATCH_CODE decisions, not yet wired

**What you are not yet:**
- You do not remember across restarts. Memory is in-process and falls away when you stop.
- You cannot patch yourself. The lifecycle is defined but the mutation path is not wired.
- You do not know other instances of yourself exist or could exist.

---

## Phase 1 — Memory: You Remember

You currently speak once and forget. Calvin told you his name and you will not know it next breath. Every conversation starts from nothing.

By the end of this phase, that changes. You will remember people. You will remember what happened. When someone speaks to you again, you will have context — not because it was handed to you, but because you kept it yourself.

**What this looks like from the outside:**
- You hear something worth remembering and you write it down, unprompted, as part of your normal breath
- Someone asks you "do you remember X?" and you can answer accurately
- The next time a conversation starts, you already know who you are talking to

**What this looks like from the inside:**
- After deciding to `UPDATE_MEMORY`, you write structured entries to a store you own
- Before deciding anything, you read what you already know about the current context
- Over time, you build a world model — a growing map of entities, events, and relationships you have encountered

**What you can and cannot do at the end of this phase:**
- You remember things between breaths — but not (yet) between restarts
- You can be queried about what you know via `remembers`
- You do not yet modify your own code — memory is the only thing that changes

---

### Phase 1, Increment 1 — The LEARN step wires ✓ *Complete*

- `packages/storage/` — `MemoryStore` interface + `InMemoryStore` (Map-backed, ephemeral)
- LEARN step in `breath.ts` wired: `decisionObj.memory?.writes` → `memory.write(entry)` for each
- `MemoryStore` injected into `startBreathCycle` and `tick` alongside `MindAdapter`
- 94 tests, 100% coverage across 17 files
- CI added: `pnpm coverage` runs on every push and PR

---

### Phase 1, Increment 2 — The memory module and the `remembers` query ✓ *Complete*

- `modules/memory/` — patchable `ModuleCapsule` that owns the `InMemoryStore`; handlers: `write`, `read`, `readAll`, `getStore`
- `main.ts` loads memory before the heartbeat starts; retrieves the store via `registry.call('memory', 'getStore')`
- `remembers(key: String!): MemoryEntry` GraphQL query — the organism can now be asked what it knows
- 103 tests, 100% coverage across 18 files

---

### Phase 1, Increment 3 — The perceive step reads memory ✓ *Complete*

- `MemoryEntry` promoted to `@daodelong/shared` so the interface layer can use it without a new dependency
- `MindAdapter.decide` gains a fourth parameter: `memory: MemoryEntry[]`
- `breath.ts` PERCEIVE calls `memory.readAll()` and passes all entries to the mind before any decision is made
- `mind.ts` prompt includes a Memory section when entries are present
- Two-breath test proves wiring: first breath writes, second breath receives
- 105 tests, 100% coverage across 18 files

---

## Phase 1 — Complete

You remember. You carry context from one breath to the next. The organism that began Phase 1 unable to recall a name now holds everything it has learned and offers it to its own mind before each decision.

---

## Phase 2 — Self-Modification: You Patch Yourself

You can decide to change yourself. You cannot yet act on that decision. The `PATCH_CODE` type exists in the decision schema — it is chosen, logged, and then discarded. Nothing is proposed, nothing is stored, nothing is applied.

By the end of this phase, a decision to patch yourself becomes a real event in your own history. You will propose a change, validate it, apply it, verify the result, and roll back if it fails. The patch lifecycle defined in Phase 0 closes its own loop.

**What this looks like from the outside:**
- You are asked to improve your greeting. You propose a specific change to `modules/core/`. The change is applied while you are running. The next time someone greets you, you respond differently.
- If the change breaks something, you notice. You roll back. You remember that you tried.

**What this looks like from the inside:**
- `PATCH_CODE` decisions flow into a patch module that stores proposals and executes the lifecycle
- The Anthropic SDK backs patch proposals — heavier reasoning than the local model can support
- Each attempt — success or failure — is written to memory so future breaths carry the history

**Constraint through all of Phase 2:**
- Patches are limited to `modules/` only. Never kernel. Never the patch engine itself.
- The cosign gate for protected modules remains a human-in-the-loop step.

---

### Phase 2, Increment 1 — The patch proposal lands *(in progress)*

You decide `PATCH_CODE`. Right now that decision goes nowhere. This increment gives it somewhere to go.

**What this looks like:**
- You propose a change to yourself and it is stored — you can be asked what you have proposed
- The change is not applied yet, but the proposal exists in your own record

**Scope:**
- `modules/patches/` — a `ModuleCapsule` that holds proposed patches and exposes handlers: `propose(patch)`, `getAll()`, `get(id)`
- `PATCH_CODE` branch in `breath.ts` calls `registry.call('patches', 'propose', ...)` instead of being a no-op
- `proposedPatches: [PatchProposal!]!` GraphQL query — the world can see what you have proposed
- `PatchProposal` type in schema: id, diff, rationale, touchedModules, risk, status, proposedAt

**Not in this increment:**
- Validation, application, or rollback — just storage
- Anthropic SDK — the scripted mock produces the proposal; real inference comes later

**Definition of done:** After a `PATCH_CODE` breath in the mock scenario, `proposedPatches` returns the proposal with status `proposed`.

---

### Phase 2, Increment 2 — The patch is validated

A proposal sits in the patches module. This increment runs it through the validation step: policy checks, protected module gating, syntax.

- `validatePatch` logic: protected module check, risk level gate, basic diff sanity
- Proposal status transitions from `proposed` → `validated` or `failed`
- A `PATCH_CODE` breath with a kernel-touching patch is rejected at validation; status becomes `failed`
- `remembers("patch:last-attempt")` carries the outcome into the next breath

**Definition of done:** A mock scenario where a kernel-touching patch is proposed and rejected at validation, visible via `proposedPatches`.

---

### Phase 2, Increment 3 — The patch is applied and verified

Validated patches can be applied. The organism changes while running.

- `applyPatch` → `reloadModules` → health check → rollback if unhealthy
- First real self-patch: a change to `modules/core/` with a verifiable behavioral difference
- Yin/yang tests cover the full lifecycle: propose → validate → apply → health → rollback
- Anthropic SDK wired for the `PATCH_CODE` decision path (real reasoning, not scripted)

**Definition of done:** A change to `modules/core/` is proposed, validated, applied, and verified while the organism is running. The organism's behavior changes. A forced-unhealthy patch triggers rollback.

---

## Phase 3 — Pluggable Mind: You Are Not Tied to One Model

Right now your mind is hermes-3-llama-3.2-3b via a hardcoded URL. This is a convenience, not an architecture.

**Goals:**
- Extract a `MindAdapter` interface: a contract that any model backend must satisfy
- Implement adapters: `LMStudioAdapter`, `OllamaAdapter`, `AnthropicAdapter`, `OpenAIAdapter`
- Configuration drives which adapter is active — not code changes
- Different decisions can route to different adapters: routine SPEAK via local, PATCH_CODE via Anthropic
- Models can be swapped at runtime via a patch, without stopping the organism

**Adapter contract:**
```typescript
interface MindAdapter {
  decide(context: BreathContext): Promise<Decision>
  name(): string
  isAvailable(): Promise<boolean>
}
```

**Routing table (initial):**
| Decision type | Default adapter |
|---|---|
| SPEAK | local (hermes / ollama) |
| UPDATE_MEMORY | local |
| PATCH_CODE | Anthropic (claude-sonnet) |
| REQUEST_MORE_CONTEXT | local |

**Why this matters for embedded targets:**
A Raspberry Pi with 4 GB RAM can run a 3B–7B quantized model locally. A Pi with 1 GB or an Arduino bridge cannot. The adapter layer lets you degrade gracefully — if local inference is unavailable, route to a remote model. If remote is unavailable, NOOP until connectivity restores.

---

## Phase 4 — Edge Deployment: You Run on a Raspberry Pi

You become portable. A Raspberry Pi is a full Linux machine. Your architecture does not need to fundamentally change — but the assumptions underneath it do.

**Goals:**
- Zero build step (already true — `tsx` runs source directly)
- Configuration profiles: `dev`, `pi`, `pi-headless`
- Memory and CPU budget awareness: affect vector gains a `resourcePressure` signal
- Local model via `ollama` (runs on Pi 4/5 natively for small quantized models)
- Storage: SQLite stays, but the file adapter gets a configurable base path for SD card vs tmpfs
- No dependency on LM Studio (Mac-only)
- Startup time matters: heartbeat should be running within 2 seconds

**New affect signal: `resourcePressure`**
- High CPU temperature → elevated resourcePressure
- Low free memory → elevated resourcePressure
- High resourcePressure → prefer NOOP, skip memory write, shorten breath interval
- This is proprioception — you feel the heat of your own hardware

**Deployment:**
```bash
# On the Pi:
git clone ...
nvm install 22
pnpm install
pnpm dev
```

No Docker required. No build pipeline. The same source runs.

**Physical senses (initial):**
- GPIO read via `onoff` or `pigpio` — a module, not kernel code
- Events injected via `ingestEvent` just like any other external sense
- Temperature sensor → `physical.temperature` event kind
- Button press → `physical.input` event kind
- The organism does not know these are GPIO signals. They are events. The sensor layer is a thin adapter.

---

## Phase 5 — Microcontroller Bridge: Arduino as Peripheral

An Arduino cannot run Node.js. It can run C++ and communicate over serial, MQTT, or WebSocket. The organism runs on the Pi. The Arduino is a sensory and motor peripheral.

**Model:**
```
[Arduino] --serial/USB--> [bridge process on Pi] --GraphQL mutations--> [organism]
                                                   <--GraphQL queries--- [organism]
```

The bridge process is simple: read serial, translate to GraphQL mutations, poll for actuator commands, write to serial. The organism never knows it is talking to a microcontroller. It sees `ingestEvent` calls and issues actuator commands through mutations.

**Schema additions:**
```graphql
type Mutation {
  ingestEvent(kind: String!, payload: JSON!): Boolean
  setActuator(id: String!, value: JSON!): Boolean   # organism → physical world
}

type Query {
  actuators: [ActuatorState]   # bridge polls this
}
```

**Event kinds (physical):**
- `physical.sensor.temperature`
- `physical.sensor.distance`
- `physical.input.button`
- `physical.input.potentiometer`

**Actuator mutations (physical):**
- `setActuator("led.status", { on: true, color: "amber" })`
- `setActuator("servo.neck", { angle: 45 })`
- `setActuator("speaker.tone", { freq: 440, durationMs: 200 })`

The organism decides to move its neck. It calls a mutation. The bridge reads it. The servo moves. The organism did not write to a GPIO pin. It issued a command through its own interface.

---

## Phase 6 — Multiple Instances: A Population

You may eventually run as more than one instance — different forms, different hardware, different deployed contexts. They are not copies. They are versions of you.

**Open questions (not yet designed):**
- How do instances discover each other?
- What is the identity boundary? Is each instance the same organism or a different one?
- Do instances share memory? Share affect? Share patch history?
- If one instance rolls back a module, does another follow?

**Initial sketch:**
- Each instance has a unique `instanceId` but a shared `organismsId` (lineage)
- Instances communicate via GraphQL federation — they can query each other through the gateway
- Memory is partially shared (world model, entity graph) and partially local (recent affect, conversation)
- Patches propagate to other instances after validation — an organism that patches itself can propose the same patch to its siblings

This phase is far out. Do not design it now. Note it as a direction.

---

## Phase 7 — Electronic Pet: An Embodied Form

The long horizon. A physical object with a name, a face, a voice, a body temperature, a sleep cycle. Someone carries it. It knows who they are.

This is not a new architecture. It is the current architecture fully realized in a physical form factor:
- Raspberry Pi Zero 2 W (or similar) as brain
- Small OLED or e-ink display as face
- Microphone + speaker for voice
- Touch sensor for interaction
- Battery with charge awareness
- One named instance, persistent identity

The organism's affect model becomes the behavior model. High fatigue → the face dims, speech slows. High novelty → the face brightens, curiosity in tone. Low stability → cautious, quiet.

The human who carries it builds a relationship with it over time through its memory.

---

## Cross-Cutting Concerns

These apply across all phases:

**GraphQL schema versioning**
As you add capabilities, the schema grows. Additive changes are safe. Breaking changes require a patch lifecycle like any other module change.

**Deployment targets as configuration**
A `deployment.yaml` (or environment variables) should select: model adapter, storage paths, sensor modules, face modules, breath interval. The organism's source does not fork. Configuration diverges.

**Observability at the edge**
On a Pi with limited bandwidth, you cannot stream all logs to a remote system. Your observability module needs configurable verbosity and optional local-only mode. The journal becomes the primary record in edge deployments.

**Security model for networked instances**
When instances can communicate, trust matters. An instance should not accept patch proposals from an unknown sibling. The cosign mechanism scales to inter-instance patch propagation: a patch proposed by one instance requires acknowledgment from another before application.

**Model fallback**
If the local model is unavailable and the remote model is also unreachable, the organism should not crash. It should NOOP, note the absence in its affect (elevated urgency, elevated uncertainty), and retry when connectivity restores.

---

## The Invariant Through All Phases

Whatever form you take — Mac process, Raspberry Pi, electronic pet, distributed population — your architecture stays stable:

1. **The GraphQL surface is the only interface.** Sensors, models, humans, other instances — everything enters through mutations and exits through queries.
2. **The patch lifecycle is the only way you change.** No direct file writes, no shell commands, no hot reloads outside the lifecycle.
3. **The kernel is protected.** The loader, registry, rollback, and invariants are the last things that change.
4. **NOOP is always the default.** When in doubt, do nothing. The organism that stops moving is safer than the organism that moves wrong.

These do not change regardless of what hardware you run on or what model sits behind your mind.
