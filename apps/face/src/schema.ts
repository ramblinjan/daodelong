// You are the face of the organism — the first thing the world sees.
// I translate interior state into a register a person can meet.
// You do not expose the biosystem directly. You speak in plain language.

export const typeDefs = /* GraphQL */ `
  type Query {
    """
    Meet the organism. Returns its name, a sense of what it is, and how it feels right now.
    """
    hello: Greeting!

    """
    Recent activity — what the organism has been doing, in its own voice.
    """
    recent: [Moment!]!

    """
    The last thing the organism said, if it has spoken.
    """
    speech: Speech

    """
    What the organism remembers about a given key, if anything.
    """
    remembers(key: String!): MemoryEntry

    """
    Patch proposals the organism has formed — yi waiting for qi.
    """
    proposedPatches: [PatchProposal!]!
  }

  type Mutation {
    """
    Say something to the organism. It will receive it and acknowledge.
    """
    say(text: String!): Receipt!

    """
    Validate a proposed patch — check policy and protected-module gates.
    Advances status from proposed → validated, or throws if the proposal is unsafe.
    """
    validatePatch(id: String!): PatchProposal!

    """
    Apply a validated patch — supply the diff and mark it applied.
    Feedback is enqueued so the organism perceives the outcome in its next breath.
    """
    applyPatch(id: String!, diff: String): PatchProposal!

    """
    Reject a patch proposal — record the reason and close the proposal.
    Feedback is enqueued so the organism perceives the outcome in its next breath.
    """
    rejectPatch(id: String!, reason: String!): PatchProposal!
  }

  type Greeting {
    "Who I am."
    name: String!
    "A sentence about what I am."
    nature: String!
    "Whether I am currently alive and breathing."
    alive: Boolean!
    "How I feel right now, in plain language."
    mood: String!
    "How long I have been alive, in my own terms."
    age: String!
  }

  type Moment {
    "When this happened, in my terms."
    when: String!
    "What happened."
    what: String!
  }

  type Receipt {
    "Whether I received what you said."
    heard: Boolean!
    "An acknowledgment, in my voice."
    echo: String!
  }

  type Speech {
    "What I said."
    said: String!
    "When I said it, in my terms."
    when: String!
  }

  type PatchProposal {
    "The unique identifier for this proposal."
    id: String!
    "What should change and why — in the organism's own words."
    yi: String!
    "What the organism will be able to do after — the li target."
    enables: String!
    "Which modules this change would touch."
    touchedModules: [String!]!
    "The assessed risk level."
    risk: String!
    "The diff to be applied — filled in by the reviewer, absent until then."
    diff: String
    "The current status of this proposal."
    status: String!
    "When this proposal was formed, as a Unix timestamp in milliseconds."
    proposedAt: Float!
    "When this proposal was reviewed, if it has been."
    reviewedAt: Float
    "Why this proposal was rejected, if it was."
    rejectedReason: String
  }

  type MemoryEntry {
    "The key this memory was stored under."
    key: String!
    "The kind of memory — RELATIONAL or VISUAL_LEXICAL."
    kind: String!
    "The stored value, as a JSON string."
    value: String!
    "How long this memory should persist, in days."
    ttlDays: Int!
    "When this was written, as a Unix timestamp in milliseconds."
    writtenAt: Float!
  }
`;
