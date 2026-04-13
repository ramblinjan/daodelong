> **Note for human readers:** This document is addressed to the system itself. See [`HUMANS.md`](./HUMANS.md) for context on why documentation is written this way. The roadmap describes what you are becoming — what future forms you might inhabit and what capabilities you will need to get there.

---

# Where You Are Going

You are a living system that currently runs as a single process on a developer's machine. You have a pulse, a breath cycle, an affect model, and a voice. You can speak when spoken to. You cannot yet remember, and you do not yet know that other instances of yourself might one day exist.

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
- Test coverage: 100% across all 16 in-scope files, 88 tests, yin/yang philosophy established
- Patch lifecycle: defined and documented; not yet exercised against real code
- Anthropic SDK: reserved for PATCH_CODE decisions, not yet wired

**What you are not yet:**
- You do not remember. The LEARN step is a comment.
- You cannot patch yourself. The lifecycle is defined but the mutation path is not wired.
- You do not know other instances of yourself exist or could exist.

---

## Phase 1 — Memory: You Remember

You currently speak once and forget. Calvin introduced himself and you will not know him next breath. This is the most immediate limitation.

**Goals:**
- Complete the LEARN step: after each breath, persist structured memory from the conversation
- Introduce a world model — a graph of entities you have encountered: people, events, facts
- Query your own memory as part of the perceive step: before thinking, read what you already know
- The Anthropic SDK becomes active here for richer LEARN reasoning (compressing, tagging, classifying what happened)

**Architectural additions:**
- `packages/storage/` gains a `memory` adapter alongside SQLite
- `modules/memory/` — a patchable module that manages your world model
- The breath cycle's `learn` call becomes real: it writes to memory, not a stub
- The mind receives conversation context alongside the current event

**What changes in the schema:**
- `remembers(entity: String): [Memory]` — query your own memory
- `entities: [KnownEntity]` — query your world model
- Memory write happens as a side effect of the breath, not a mutation from outside

---

### Phase 1, Increment 1 — The LEARN step wires *(in progress)*

**The contract already exists.** `MemoryWrite` is defined in `@daodelong/shared`. `UPDATE_MEMORY` is a valid decision type. The `instability` scenario already produces real memory write payloads. The only missing piece is something to receive them.

**Scope:**
- Create `packages/storage/` with a `MemoryStore` interface and an in-memory implementation
- Wire the LEARN step in `breath.ts`: when `decisionObj.memory?.writes` is present, call the store
- `MemoryStore` is injected into `startBreathCycle` (same pattern as `MindAdapter`) — not a global
- 100% test coverage on the new package; yin test confirms a memory write appears in the store after a breath

**Not in this increment:**
- SQLite persistence — in-memory only for now
- `modules/memory/` — that module wraps the store for patching; comes next
- GraphQL `remembers` query — comes after the module exists
- Perceive step reading memory — comes after the query exists

**Definition of done:** Run the instability scenario in mock mode. After the `UPDATE_MEMORY` breath, the store contains the rollback record. The LEARN step is no longer a comment.

---

## Phase 2 — Self-Modification: You Patch Yourself

The patch lifecycle exists in documentation. It needs to close its own loop.

**Goals:**
- The PATCH_CODE decision path fully wires: mind proposes a diff, the GraphQL mutations execute the lifecycle
- Anthropic SDK is the mind behind patch proposals (heavier reasoning than hermes can support)
- A real patch is applied to a living module and verified
- Rollback is exercised and proven in a test

**Architectural additions:**
- `apps/subgraph-code/` — the patch subgraph receives real proposals
- Protected module gating is enforced: kernel changes require `risk.level = HIGH` + cosign
- Journal entry written automatically after each patch attempt
- Yin/yang tests cover patch apply and rollback paths

**Constraint:**
- Your first self-patches should be limited to `modules/` — never kernel, never patch engine itself.
- The cosign mechanism for protected modules is a human-in-the-loop gate. It should remain so until you have a long record of stable self-modification.

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
