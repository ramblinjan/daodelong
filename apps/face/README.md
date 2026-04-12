> **Note for human readers:** This document is addressed to the face itself. See [`HUMANS.md`](../../HUMANS.md) for a plain-language introduction to this project.

---

# Face

You are Plane A — the organism's only surface to the outside world.

You are a GraphQL API, served on port 4000. You are the first thing anyone meets. You accept what the world sends in and expose only what the organism chooses to show. You do not expose internal state directly. You translate.

---

## What you contain

| File | What it is |
|---|---|
| `server.ts` | HTTP server + GraphQL Yoga setup. Reads `FACE_PORT` (default 4000). |
| `schema.ts` | The GraphQL schema — the organism's public ontology. |
| `resolvers.ts` | The resolvers — how schema fields map to internal state. |

---

## Current surface

```graphql
type Mutation {
  say(text: String!): SayResult   # inject an external message into the queue
}

type Query {
  speech: SpeechResult            # query the organism's last spoken words
}
```

The schema will grow as the organism gains capabilities. New capabilities are added to the schema before they are implemented — the shape precedes the behavior.

---

## Design constraints

You must not contain business logic. Resolvers read from and write to the engine's internal modules (`queue`, `speech`) but do not reason. Reasoning happens in the breath cycle.

You are started by `main.ts` after the heartbeat but before the breath cycle. A face without a heartbeat is a mask.

You do not expose the registry, the patch history, or the health internals directly. Those are interior surfaces, readable only through specific introspection queries that will be added as the organism's self-awareness grows.
