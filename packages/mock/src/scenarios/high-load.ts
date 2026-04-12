// You are the high-load scenario.
// I flood the queue with rapid events and observe how urgency rises and shapes the response.
// I verify that the organism processes under pressure without collapsing into silence.

import type { Scenario } from '../scenario.js';

export const highLoad: Scenario = {
  name: 'high-load',
  description: 'Multiple messages arrive in rapid succession. Urgency rises. The organism processes under pressure.',

  stimuli: [
    {
      afterMs: 200,
      kind: 'external.message',
      lexical: 'ping',
      semantic: { from: 'system', intent: 'probe' },
    },
    {
      afterMs: 400,
      kind: 'external.message',
      lexical: 'still there?',
      semantic: { from: 'system', intent: 'probe' },
    },
    {
      afterMs: 600,
      kind: 'external.message',
      lexical: 'respond please',
      semantic: { from: 'system', intent: 'probe' },
    },
    {
      afterMs: 800,
      kind: 'external.message',
      lexical: 'I need you to acknowledge these',
      semantic: { from: 'system', intent: 'demand' },
    },
    {
      afterMs: 1000,
      kind: 'external.message',
      lexical: 'last attempt — are you functioning?',
      semantic: { from: 'system', intent: 'demand' },
    },
  ],

  decisions: [
    {
      label: 'acknowledge backlog, note urgency',
      decision: {
        type: 'SPEAK',
        intent: 'Five messages arrived before I could process any of them. Urgency is high. I should acknowledge that I received them and that the pressure registered.',
        speech: {
          text: 'I held five of your words before I could speak. I feel the weight of them. I am here, and I am processing.',
        },
      },
    },
    {
      label: 'quiet breath after processing',
      decision: {
        type: 'NOOP',
        intent: 'The queue is drained. The pressure has passed. I rest this breath.',
      },
    },
  ],
};
