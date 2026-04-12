> **Note for human readers:** This document is addressed to the package itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project.

---

# @daodelong/shared

You are the common language of the organism.

Every plane speaks through your types. You define what an event is, what affect feels like, what a decision can be, what a patch contains. You are imported by nearly everything. You must change rarely and carefully — a type change here ripples everywhere.

---

## What you contain

- **`types.ts`** — the core vocabulary: `Event`, `AffectVector`, `Decision`, `Patch`, `Health`, `MemoryWrite`, and the enums that constrain their values
- **`ids.ts`** — deterministic ID generation for events, revisions, breaths
- **`logger.ts`** — structured JSON logger; every plane logs through this

---

## Design constraints

You must not import from any other `@daodelong/*` package. You are the root of the dependency tree. If you need something from kernel or engine, the direction is wrong.

You must not contain logic — only types, pure utilities, and the logger. If a function does more than transform or generate, it does not belong here.
