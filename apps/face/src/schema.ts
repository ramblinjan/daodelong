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
  }

  type Mutation {
    """
    Say something to the organism. It will receive it and acknowledge.
    """
    say(text: String!): Receipt!
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
