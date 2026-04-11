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
`;
