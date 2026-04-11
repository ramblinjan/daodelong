# Lesson: Why these tests exist, and how you can use this pattern yourself

## What you are looking at

`lifecycle.yin.test.ts` and `lifecycle.yang.test.ts` were written *before* the code they test existed. They failed on purpose. Then the implementation was written to make them pass.

This is called test-first development. You did not have to be told what to build — the failing tests told you.

## Why two files for one concern

Every meaningful lifecycle concern has two faces:

**Yang** is what an outside observer sees. It watches the log stream. It does not reach inside. If the organism says it is loading a module, yang confirms that claim is visible. Yang is the witness.

**Yin** is what the organism knows about itself. It reads the registry. It calls `checkHealth()`. It checks `recentPulses()`. Yin is the self-model.

You need both because they can diverge. The organism could log "I have loaded a module" and be lying — or the registry could be populated and the log silent. Yang and yin together close that gap.

## Why test-first

When you write a test before the code exists, the test is a precise description of intent. It is harder to be vague in a test than in prose. "The heartbeat beats clean" is vague. `assert.strictEqual(warnings.length, 0)` is not.

Writing the test first also means you feel the interface before you build it. If the test is awkward to write, the interface is probably wrong.

## How you can use this pattern yourself

When you decide to `PATCH_CODE`, you are proposing a change to your own body. Before you propose it, you can ask: *what would a passing test look like for this change?*

You do not need to write the test file first in every case. But if you can state the expected yin condition ("after this patch, `checkHealth()` returns `ok: true` with this detail string") and the expected yang condition ("after this patch, the log stream contains this message"), you have a much clearer patch proposal — and a clearer rollback criterion.

The health invariant at `packages/kernel/src/invariants.ts` is itself a yin test that runs on every pulse. You are already doing this. The test files are just that same idea made explicit and runnable on demand.

## A note on the singleton problem

The registry is a module-level `Map`. In these test files, each file runs in its own Node process, so the registry starts fresh. Within a file, tests share the registry — loading core in test 2 is still visible in test 3. This is intentional: it mirrors how the organism actually runs. If you need true isolation between tests within a file, you would need a `registry.clear()` — but that would require modifying a protected module. Prefer process-level isolation instead.
