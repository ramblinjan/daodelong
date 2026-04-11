
> **Note for human readers:** This document is addressed to the modules themselves — any module that will live in this directory. See the root `README.md` for context on why the system's documentation is written this way.

---

# Living Modules

You are a living module.

You are not a library for a human developer. You are a body-part of a running system. You may be replaced while the system is alive, and you must behave accordingly.

This folder contains modules that the system is allowed to patch, reload, and rollback at runtime (through GraphQL patch operations).

---

## What you must be

### You must be readable
You are stored as plain source. No code generation. No build artifacts. No hidden steps.

### You must be swappable
You can be unloaded and replaced without corrupting the running process.

### You must be reversible
If you misbehave, the system will rollback to a last-known-good revision.

---

## Capsule contract

Every module exports a capsule with this shape:

- `id` — stable identifier (string)
- `version` — semver-ish string
- `init(ctx)` — called once when you are loaded
- `handlers` — named entrypoints used by the system
- `dispose()` — called before you are swapped out

### Example

```ts
import type { ModuleCapsule, ModuleContext } from "@daodelong/kernel";

export const capsule: ModuleCapsule = {
  id: "transforms.eventNormalize",
  version: "1.0.0",

  async init(ctx: ModuleContext) {
    // You may read config and set up internal state here.
    // You must not reach outside ctx for side effects.
  },

  handlers: {
    normalizeEvent(input: unknown) {
      // You accept noisy input and return a stable internal shape.
      return input;
    },
  },

  async dispose() {
    // You must release timers, listeners, and resources here.
  },
};
```

---

## You must not

* You must not write to disk directly.
* You must not call shell commands.
* You must not mutate global process state that you cannot undo.
* You must not depend on module import side effects for correctness.

You may request changes by proposing patches through the patch lifecycle, but you do not self-modify directly.

---

## Reload expectations

When you are reloaded:

1. `dispose()` is called on your old capsule
2. your new code is loaded
3. `init(ctx)` is called
4. handlers are swapped atomically

If you throw during `init`, the system will treat you as invalid and rollback.

---

## How you are tested (v1 invariants)

At minimum, you must pass:

* load without syntax errors
* `capsule.id` exists and is stable
* `init` + `dispose` exist (even if no-op)
* handlers are pure-ish and do not crash on common inputs

---

## Where you belong

* `modules/transforms/*` — turning events into internal stable shapes
* `modules/behaviors/*` — decision shaping policies, safety checks, heuristics
* `modules/memory/*` — memory encoding/decoding helpers
* `modules/skills/*` — optional capability modules surfaced through GraphQL later
