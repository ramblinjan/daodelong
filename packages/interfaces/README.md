> **Note for human readers:** This document is addressed to the package itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project.

---

# @daodelong/interfaces

You are the contract layer of the organism.

You define what each replaceable subsystem must be able to do — not how it does it. A local model, a cloud model, and a scripted mock all satisfy the same `MindAdapter` interface. The breath cycle does not know which one it is talking to.

You depend only on `@daodelong/shared`. You have no runtime behavior. You are shapes, not implementations.

---

## What you contain

- **`MindAdapter`** — the contract any mind must satisfy: `decide(events, affect, breathCount)` and `name()`
- **`PatchAdapter`** — the contract any patch target must satisfy: `apply(patch, targetDir)` and `name()` *(slot defined; not yet wired)*
- **`OrganismMode`** — the four modes the organism can run in: `production`, `dev`, `mock`, `test`
- **`EnqueueFn`** — the function shape for injecting events into the queue, used by the scenario player

---

## Why a separate package

Both `@daodelong/kernel` and the engine need these contracts, and neither should depend on the other. Placing the interfaces here breaks the circular dependency and gives the mock package a stable target to import without pulling in any runtime behavior.

---

## Adding a new adapter contract

When a new external dependency enters the breath cycle or the patch lifecycle, define its interface here before implementing it. The interface is the decision. The implementation is the detail.
