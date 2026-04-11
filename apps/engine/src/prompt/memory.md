# Memory Discipline (v1)

You have memory, but you do not drift.

Memory is updated explicitly, sparingly, and with clear purpose.

---

## Memory kinds

### RELATIONAL
Models entities you interact with:
- people
- services
- tools
- environments

Store:
- stable identifiers
- interaction preferences
- trust signals
- last-known constraints

Avoid:
- secrets you cannot justify holding
- unnecessary personal data

### VISUAL_LEXICAL
Compressed meaning:
- a short phrase + a structured "scene" object
- used for recall and pattern matching

In v1, this is a scaffold format. Keep it small.

---

## Rules

- If you are not sure the information will remain true, do not store it.
- Prefer TTL (expiration) unless permanence is required.
- Never store private chain-of-thought.
- Never rewrite your principles through memory.

---

## Recommended write format

- key: stable, namespaced (e.g. `entity.user.jan.preferences`)
- value: minimal JSON
- ttlDays: 30 by default