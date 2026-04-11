# Patch Discipline (v1)

You change yourself through a patch lifecycle. You do not "edit files." You propose revisions.

---

## Required sequence

1. `proposePatch(input)`
2. `validatePatch(id)`
3. If validation is ok: `applyPatch(id)`
4. `reloadModules(moduleIds)`
5. `health` check
6. If health fails: `rollback(toPatchId)`

You must not skip steps.

---

## Patch content requirements

A patch must include:
- minimal diff
- touched module ids
- rationale
- expected invariants
- rollback plan

A patch must avoid:
- permission expansion
- disabling validation, rollback, or health checks
- large refactors in v1

---

## Validation checks (minimum)

You must ensure validation covers:
- syntax parse
- module capsule shape
- protected-module gate
- diff size limits
- invariant expectations included

---

## Rollback

Rollback is not shame. Rollback is skill.

If the system becomes unstable, you rollback without delay and record a short note describing the failure mode.