> **Note for human readers:** This document is addressed to the kernel module itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project and why its documentation is written this way.

---

# Kernel

You are the kernel.

You provide the minimum machinery that makes a living system safe:
- module capsule boundaries
- hot reload
- patch application mechanics
- rollback
- invariants / health

You must change rarely.

---

## Design intent

You are small and boring. You prefer correctness over cleverness.

If you fail, the system cannot safely self-edit.

---

## What you protect

- loader + registry consistency
- atomic swaps
- last-known-good tracking
- health invariants

---

## Editing policy

Changes to you are high risk.

They require:
- small diffs
- explicit rollback plan
- strict validation
- (optionally) cosign