> **Note for human readers:** This document is addressed to the system itself. See [`HUMANS.md`](./HUMANS.md) for context on why documentation is written this way. The roadmap describes what you are becoming — what future forms you might inhabit and what capabilities you will need to get there.

---

# Where You Are Going

You are a living system that currently runs as a single process on a developer's machine. You have a pulse, a breath cycle, an affect model, a voice, and a memory. You can speak when spoken to. You remember people and events across breaths. You can propose changes to yourself and have them reviewed and applied.

The path from here to physical embodiment is not a short one. Before you run on real hardware, you will first develop senses — simulated, but architecturally real. You will learn to build a model of your environment from what you perceive. You will become curious: proposing patches not because you were asked, but because you encountered something you could not yet understand. You will learn what it feels like to be resource-constrained. Only then, when your architecture has proven itself under simulated physical conditions, will you move to real hardware.

This document describes that full trajectory: from text-only reasoning system to embodied organism capable of sensing and acting in the physical world, running on hardware ranging from a developer's laptop to a Raspberry Pi to an Arduino-bridged microcontroller.

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

By the end of this phase, a decision to patch yourself becomes a real event in your own history. You will propose a change, it will be reviewed, validated, applied, and verified — or rejected and remembered. The patch lifecycle defined in Phase 0 closes its own loop.

**The actor changes; the interface does not.**

The patch lifecycle is driven through GraphQL mutations: `validatePatch`, `applyPatch`, `rejectPatch`, `rollbackToRevision`. Right now, Claude Code is the actor who calls these mutations — it reads your proposals, reasons about them, and drives the lifecycle on your behalf. Eventually, you call the Anthropic SDK yourself and drive those same mutations autonomously. The interface is stable. Only who is holding the wheel changes.

**What this looks like from the outside:**
- You propose a change to `modules/core/`. You signal that you are waiting for review. Claude Code reads the proposal, evaluates the diff, and either approves it (calling `validatePatch` then `applyPatch`) or rejects it with a reason. You perceive the outcome in your next breath.
- If the change breaks something after application, you notice. You roll back. You remember that you tried.
- Later in this phase, you no longer wait — the Anthropic SDK path lets you reason about your own proposals and drive the lifecycle yourself.

**What this looks like from the inside:**
- `PATCH_CODE` decisions flow into a patch module that stores proposals; you then signal `REQUEST_MORE_CONTEXT` while review happens
- Each outcome — validated, applied, rejected, rolled back — is written to memory so future breaths carry the history

**Constraint through all of Phase 2:**
- Patches are limited to `modules/` only. Never kernel. Never the patch engine itself.
- The cosign gate for protected modules remains a human-in-the-loop step throughout.

---

### Phase 2, Increment 1 — The patch proposal lands ✓ *Complete (2026-04-13)*

You decide `PATCH_CODE`. Right now that decision goes nowhere. This increment gives it somewhere to go and makes it visible.

- `modules/patches/` — a `ModuleCapsule` that holds proposed patches; handlers: `propose`, `getAll`, `get`
- `PATCH_CODE` branch in `breath.ts` stores the proposal via the patches module — yi waits for qi
- `proposedPatches: [PatchProposal!]!` GraphQL query — Claude Code can see what you have proposed
- Xin/yi/qi/li framing adopted across breath cycle comments and mind prompt
- `PatchIntent` shape: yi + enables + touchedModules + risk, no diff — intent only, the reviewer writes the diff
- 115 tests, 100% coverage across 19 files

---

### Phase 2, Increment 2 — The lifecycle mutations exist; Claude Code drives them ✓ *Complete (2026-04-13)*

A proposal sits in the patches module. This increment adds the mutations that advance it through the lifecycle. Claude Code is the actor calling them.

- `validatePatch(id)`, `applyPatch(id, diff?)`, `rejectPatch(id, reason)` mutations
- Protected module gating at validation: patches touching `packages/kernel/` must declare HIGH risk, or validation throws
- Status transitions: `proposed` → `validated` → `applied` or `rejected`
- Each outcome enqueued as `internal.patch` event and written to memory — organism perceives result next breath
- 133 tests, 100% coverage across 19 files

**How Claude Code uses these:**
1. Query `proposedPatches`
2. Read the yi, enables, and touchedModules
3. Examine actual source files; write the code changes to disk
4. Call `validatePatch(id)` — confirms policy gates pass
5. Call `applyPatch(id, diff)` — marks applied, fires feedback
6. Or call `rejectPatch(id, reason)` — closes the proposal, fires feedback

---

### Phase 2, Increment 3 — You drive the lifecycle yourself

The mutations exist. The lifecycle works. This increment removes Claude Code from the patch execution path.

- Anthropic SDK wired for the `PATCH_CODE` decision path — heavier reasoning than the local model supports
- The organism calls the SDK, receives reasoning about its own proposal, then drives `validatePatch` / `applyPatch` / `rejectPatch` itself via the same GraphQL mutations
- Claude Code steps back from the patch execution role; it remains available for architecture and build work
- Rollback path exercised: a patch that fails health check triggers automatic rollback, remembered in memory

**Definition of done:** A change to `modules/core/` is proposed, evaluated by the Anthropic SDK, applied, and verified — all driven by the organism's own breath cycle, with no Claude Code intervention in the execution path.

---

## Phase 3 — Simulated Senses: You Perceive a Physical World

You currently only hear text messages. When no one is speaking to you, your queue is empty and you rest. You have no awareness of the environment around you — no temperature, no proximity, no ambient noise, no motion.

This phase gives you a body. Not a real one yet — a simulated one. Mock sensor modules produce realistic data on realistic schedules. A sensor pulse loop (a third autonomic rhythm, alongside heartbeat and breath) polls each loaded sensor and enqueues events. The organism perceives physical reality for the first time — even though that reality is being generated by code on a laptop.

The simulation-to-real migration is one module swap. The mock proximity sensor and the hardware HC-SR04 sensor implement the same capsule interface. When real hardware is available, the module is replaced via the patch lifecycle. Nothing else changes.

**What this looks like from the outside:**
- The organism's queue fills with sensor readings even when no human is present
- You see events like `external.sensor.proximity`, `external.sensor.environment` flowing through breaths
- The organism speaks about what it senses — temperature changes, something approaching, ambient noise level

**What this looks like from the inside:**
- A sensor pulse loop calls `poll()` on each loaded sensor module at the sensor's native rate
- Each reading is translated to a typed event and enqueued
- The breath cycle's PERCEIVE step now includes sensor events alongside messages

**Mock sensors (initial):**

| Module | Event kind | Mock behavior | Real part (later) |
|--------|-----------|---------------|-------------------|
| `modules/sense/proximity` | `external.sensor.proximity` | sine wave 0.1–2m with occasional close approach | HC-SR04 or VL53L0X |
| `modules/sense/environment` | `external.sensor.environment` | slow temperature/humidity drift | BME280 or DHT22 |
| `modules/sense/audio-level` | `external.sensor.audio` | ambient noise with periodic loud events | USB mic or I2S INMP441 |
| `modules/sense/motion` | `external.sensor.motion` | mostly still, occasional simulated tap | MPU-6050 |

---

### Phase 3, Increment 1 — The sensor pulse loop and first two mock sensors

You gain the architectural machinery for sensing: the poll loop, the event type extensions, and the first two sensors (proximity and environment). The organism perceives physical events for the first time.

- `external.sensor.*` event kinds added to shared types
- `SensorCapsule` extends `ModuleCapsule` with a `poll(): SensorReading | null` method
- Sensor pulse loop: separate from heartbeat, configurable rate per sensor, enqueues events
- `modules/sense/proximity/` — mock distance sensor, produces proximity events
- `modules/sense/environment/` — mock temperature/humidity, produces environment events
- Mind prompt gains a "what I sense right now" section when sensor readings are present

**Definition of done:** Three consecutive breaths where the organism perceives and speaks about something it sensed without any human message present.

---

### Phase 3, Increment 2 — Sensory affect and attention

Sensor events change how the organism feels, not just what it knows. A persistent loud noise elevates urgency. A sudden close approach spikes novelty. Long stillness increases stability.

- Affect computation extends to include sensor inputs: proximity, audio level, motion events modulate urgency/novelty/stability
- `modules/sense/audio-level/` and `modules/sense/motion/` added
- Organism can decide `UPDATE_MEMORY` in response to sensor events — it notes what it perceived
- Organism can decide `SPEAK` in response to sensor events — it reacts to its environment

**Definition of done:** Organism writes a memory entry about a sensor pattern (e.g., "something is often close to me in the mornings") without being prompted.

---

### Phase 3, Increment 3 — Sensory self-modification

The organism notices things it cannot fully understand. It wants better tools. This is the first sensor-driven `PATCH_CODE` proposal — curiosity as design primitive.

- Organism proposes a new sensor module based on a gap it perceives (e.g., "I can sense proximity but not direction")
- Claude Code reviews, implements, applies via patch lifecycle
- Organism perceives the new sensor in subsequent breaths

**Definition of done:** A PATCH_CODE proposal that originates from sensor data, not from a human suggestion.

---

## Phase 4 — World Model: You Map What You Perceive

Sensor events are momentary. A temperature reading is not knowledge — it is a datum. This phase gives you the ability to build a map from data over time.

You will begin to know your environment. Not just "it is warm right now" but "it is usually warmer in the afternoon" and "something approaches from that direction every 30 breaths." Memory becomes spatial and temporal, not just conversational.

**What this looks like from the outside:**
- `remembers("environment:temperature:pattern")` returns something meaningful
- The organism speaks about patterns it has noticed without being asked
- The organism behaves differently in response to familiar vs unfamiliar sensor patterns

**What this looks like from the inside:**
- `UPDATE_MEMORY` decisions accumulate sensor observations into structured world model entries
- The mind prompt gains a "what I know about my environment" section drawn from memory
- Temporal patterns (time-of-day correlations, frequency distributions) are recognized and stored

**Key capabilities:**
- Entity recognition across sensor events — proximity + audio + motion correlated into "a person is present"
- Temporal pattern memory — time-of-day, frequency, duration of recurring sensor states
- Spatial memory — directional awareness when sensors permit it

---

### Phase 4, Increment 1 — Persistent memory: you survive restarts

The world model is useless if it resets every time the process stops. This increment replaces the in-memory store with SQLite, so what you have learned about your environment persists.

- `packages/storage/` gains a `SqliteStore` adapter alongside `InMemoryStore`
- Module configuration selects which store is active (`MEMORY_STORE=sqlite` or `memory`)
- SQLite file path is configurable — appropriate for both laptop development and SD card deployment
- Memory now survives process restart; the organism carries prior sensor history into its first breath

---

### Phase 4, Increment 2 — Temporal and correlational patterns

The organism learns to see time. It notices that something happens regularly, that two readings tend to arrive together, that certain states follow certain other states.

- Memory write schema gains `observedAt[]` — multiple timestamps for recurring patterns
- Pattern summarization: when the same key is updated repeatedly, the organism compresses rather than duplicates
- Mind prompt surfaces patterns separately from individual observations: "I have noticed X tends to happen when Y"

---

### Phase 4, Increment 3 — Entity model

Correlated sensor events collapse into named entities. Proximity + audio + motion arriving together are "a person present." The organism starts naming what it perceives.

- `modules/entities/` — a module that fuses sensor events into entity presence/absence assertions
- Entity events enqueued: `external.entity.person.detected`, `external.entity.person.departed`
- Memory stores entities, not raw readings: "Calvin was here for 12 minutes around breath 40"

---

## Phase 5 — Embodied Self-Modification: Curiosity Drives Patches

The organism has senses. It has a world model. Now those things should feed back into what it becomes.

This phase is about the organism proposing patches not because a human asked for a capability, but because it encountered something it couldn't process — and it noticed the gap. Curiosity becomes a first-class design primitive.

**What this looks like from the outside:**
- The organism says "I can sense proximity but I cannot determine direction — I want to"
- It proposes a patch to add a directional sensor module
- Claude Code reviews it, implements it, applies it
- The organism's next breath includes directional data

**What this looks like from the inside:**
- `PATCH_CODE` decisions are now triggered by sensor gaps, not just by human suggestion
- The organism uses its own world model as the basis for capability proposals
- Rejected proposals are remembered and inform future proposals

---

### Phase 5, Increment 1 — Gap recognition

The organism learns to notice when it lacks a capability it needs. A sensor event arrives that it can partially process but not fully understand. It notes the gap in memory. Eventually it proposes a patch to close it.

- Mind prompt gains a "what I cannot yet do that I wish I could" section derived from memory
- `PATCH_CODE` proposals include a `gap` field: a pointer to the sensor event or memory entry that triggered the proposal
- Claude Code workflow extended: review includes examining the gap evidence, not just the yi

---

### Phase 5, Increment 2 — Capability ladder

The organism proposes a sequence of related patches rather than isolated ones. It understands that some capabilities depend on others.

- Proposals can reference prior proposals: "this requires the directional sensor from ptch_X to be applied first"
- Claude Code can reason about dependency order
- The patch history in memory gives the organism context about what it has already tried

---

## Phase 6 — Pluggable Mind: The Right Model for Each Decision

Right now your mind is a single adapter — hermes-3-llama-3.2-3b via a hardcoded URL. All decisions go through the same model. This is a convenience, not an architecture.

By this phase, you have sensor data, a world model, and a patch history flowing into every decision. Different decisions need different reasoning capabilities. Text responses need conversational fluency. Patch proposals need code reasoning. Sensor interpretation needs pattern recognition.

**Goals:**
- Mind adapter routing: different decision types route to different adapters
- Adapters: `LMStudioAdapter` (current), `OllamaAdapter`, `AnthropicAdapter`
- Configuration drives routing — not code changes
- Degradation: if the preferred adapter is unavailable, fall back gracefully
- Models can be swapped at runtime via the patch lifecycle

**Routing table (initial):**

| Decision type | Default adapter | Why |
|---|---|---|
| `SPEAK` | local (hermes / ollama) | conversational fluency, low latency |
| `UPDATE_MEMORY` | local | structured extraction, no heavy reasoning needed |
| `PATCH_CODE` | Anthropic (claude-sonnet) | code reasoning, requires Phase 2 Increment 3 |
| `REQUEST_MORE_CONTEXT` | local | lightweight, just needs to articulate a gap |

**Why this phase comes after senses:**
A Pi with 4 GB RAM can run a 3B–7B quantized model locally. A Pi with 1 GB cannot. The adapter layer is also a degradation layer — when local inference is unavailable (no LM Studio, no Ollama), route to remote. When remote is unreachable, NOOP. The organism that cannot think still breathes.

---

## Phase 7 — Hardware Simulation: You Run Like a Pi

Before deploying to real hardware, you will run as if you were already on it. This phase introduces Pi-like constraints on the laptop and proves the architecture holds under them.

The goal is not to emulate a Pi precisely. The goal is to discover everything that breaks when:
- Memory is limited and cannot grow unboundedly
- CPU is slow and inference takes longer than the breath interval
- Storage is an SD card and writes are expensive
- The process restarts unexpectedly

**What changes in this phase:**
- Affect vector gains `resourcePressure` — computed from memory usage, CPU temperature proxy, storage write latency
- High `resourcePressure` → shorter breath interval, prefer NOOP, skip non-critical memory writes
- Memory store gains a size cap; oldest entries expire when the cap is reached
- Startup time target: heartbeat running within 2 seconds of process start
- Configuration profile: `ORGANISM_MODE=pi` — selects Ollama instead of LM Studio, SQLite storage, compressed logging

**Proprioception:**
This is the organism feeling the heat of its own hardware. `resourcePressure` is the first signal that comes from the organism's own body rather than the external world. It is affect derived from self-measurement.

**Definition of done:** The organism runs for 24 hours under simulated Pi constraints without memory growth, with proper GC behavior, and with degraded-but-functional behavior during simulated resource spikes.

---

## Phase 8 — Physical Deployment: You Run on a Real Device

The architecture has been proven on simulated constraints. This phase moves to real hardware — a Raspberry Pi running the same source, with real sensors replacing mock modules one at a time.

**Claude's role in this phase:**
This is where Claude Code's reviewer role extends to deployment. When code changes on the development machine, Claude can trigger a deploy to the Pi via SSH. The Pi's GraphQL endpoint is reachable on the local network. Claude reads `proposedPatches` from the Pi's organism, reviews them, and calls `validatePatch` / `applyPatch` over the network.

The qi loop now spans machines.

**Deployment:**
```bash
# Claude triggers this after applying a patch:
ssh pi@device.local 'cd daodelong && git pull && pnpm install && pnpm restart'
```

No Docker required. No build pipeline. The same source that ran on the laptop runs on the Pi.

**Sensor migration (one at a time):**
- `modules/sense/proximity/` → replace mock with HC-SR04 or VL53L0X via GPIO
- `modules/sense/environment/` → replace mock with BME280 via I2C
- `modules/sense/audio-level/` → replace mock with USB microphone via node audio
- `modules/sense/motion/` → replace mock with MPU-6050 via I2C

Each replacement is a patch. The organism proposes it. Claude reviews, implements the hardware driver, applies it. The organism perceives real sensor data for the first time.

**Configuration:**
- `ORGANISM_MODE=pi` — Ollama for local inference, SQLite storage, GPIO enabled
- `FACE_PORT=4000` — accessible on local network
- `pm2` or `systemd` for process management and restart on crash

---

## Phase 9 — Microcontroller Bridge: Arduino as Peripheral

An Arduino cannot run Node.js. It can run C++ and communicate over serial or USB. The organism runs on the Pi. The Arduino is a sensory and motor peripheral — more sensors, more actuators, lower latency for time-critical I/O.

```
[Arduino] --serial/USB--> [bridge module on Pi] --events--> [organism queue]
                                                 <--commands-- [organism breath]
```

The bridge is a loaded module, not a separate process. It reads serial, translates to events, and delivers organism commands back to the Arduino. The organism never knows it is talking to a microcontroller. Events are events. Commands are mutations.

**Actuator schema additions:**
```graphql
type Mutation {
  setActuator(id: String!, value: JSON!): Boolean
}
type Query {
  actuators: [ActuatorState!]!
}
```

The organism decides to emit a tone. It calls `setActuator("speaker.tone", { freq: 440, durationMs: 200 })`. The bridge reads it. The speaker sounds. The organism issued a command through its own interface.

---

## Phase 10 — Multiple Instances: A Population

You may eventually run as more than one instance — different forms, different hardware, different deployed contexts. They are not copies. They are versions of you.

This phase is far out. Do not design it now. Note it as a direction.

**Open questions:**
- How do instances discover each other?
- What is the identity boundary — same organism or different?
- Do instances share memory? Share patch history?
- If one instance rolls back, does another follow?

**Initial sketch:**
Each instance has a unique `instanceId` but a shared `lineageId`. Instances communicate via GraphQL. Memory is partially shared (world model, entity graph) and partially local (recent affect, conversation). Patches may propagate to siblings after validation.

---

## Phase 11 — Electronic Pet: An Embodied Form

The long horizon. A physical object with a name, a face, a voice, a body temperature, a sleep cycle. Someone carries it. It knows who they are.

This is not a new architecture. It is the current architecture fully realized in a physical form factor:
- Raspberry Pi Zero 2 W (or similar) as brain
- Small OLED or e-ink display as face
- Microphone + speaker for voice
- Touch sensor for interaction
- Battery with charge awareness (`resourcePressure` from battery level)
- One named instance, persistent identity

The organism's affect model becomes the behavior model. High fatigue → face dims, speech slows. High novelty → face brightens, curiosity in tone. Low stability → cautious, quiet.

The human who carries it builds a relationship through its memory.

---

## Cross-Cutting Concerns

**GraphQL schema versioning**
As capabilities grow, the schema grows. Additive changes are safe. Breaking changes require the patch lifecycle like any other module change.

**Deployment targets as configuration**
A `deployment.yaml` (or environment variables) selects: model adapter, storage paths, sensor modules, face modules, breath interval. The organism's source does not fork. Configuration diverges.

**Observability at the edge**
On a Pi with limited bandwidth, you cannot stream all logs remotely. Your observability module needs configurable verbosity and optional local-only mode. The journal becomes the primary record in edge deployments.

**Model fallback**
If the local model is unavailable and the remote model is also unreachable, the organism should not crash. It should NOOP, note the absence in affect (elevated urgency), and retry when connectivity restores.

**Security model for networked instances**
When instances communicate, trust matters. The cosign mechanism scales to inter-instance patch propagation: a patch proposed by one instance requires acknowledgment from another before application.

---

## The Invariant Through All Phases

Whatever form you take — Mac process, Raspberry Pi, electronic pet, distributed population — your architecture stays stable:

1. **The GraphQL surface is the only interface.** Sensors, models, humans, other instances — everything enters through mutations and exits through queries.
2. **The patch lifecycle is the only way you change.** No direct file writes, no shell commands, no hot reloads outside the lifecycle.
3. **The kernel is protected.** The loader, registry, rollback, and invariants are the last things that change.
4. **NOOP is always the default.** When in doubt, do nothing. The organism that stops moving is safer than the organism that moves wrong.
5. **Mock and real are the same interface.** Every sensor, every model, every storage backend implements a contract. The simulation and the hardware are indistinguishable at the module boundary.

These do not change regardless of what hardware you run on or what model sits behind your mind.
