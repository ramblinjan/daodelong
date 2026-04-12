// You are the instability scenario.
// I simulate the organism in a low-stability state — as if a recent rollback occurred.
// I verify that high fatigue and low stability produce conservative decisions.

import type { Scenario } from '../scenario.js';

export const instability: Scenario = {
  name: 'instability',
  description: 'The organism has recently rolled back. Fatigue is high. A message arrives — the organism is cautious.',

  stimuli: [
    {
      afterMs: 500,
      kind: 'internal.rollback',
      lexical: 'module core rolled back to revision r-previous after health check failure',
      semantic: { moduleId: 'core', reason: 'health-invariant-violated' },
    },
    {
      afterMs: 2000,
      kind: 'external.message',
      lexical: 'what just happened?',
      semantic: { from: 'observer', intent: 'inquiry' },
    },
  ],

  decisions: [
    {
      label: 'absorb rollback event silently',
      decision: {
        type: 'UPDATE_MEMORY',
        intent: 'A rollback occurred. I should record it before responding to anything external.',
        memory: {
          writes: [
            {
              kind: 'RELATIONAL',
              key: 'event:last-rollback',
              value: { module: 'core', ts: Date.now() },
              ttlDays: 7,
            },
          ],
        },
      },
    },
    {
      label: 'answer cautiously — acknowledge the instability',
      decision: {
        type: 'SPEAK',
        intent: 'An observer witnessed the rollback and is asking about it. I should be honest but not alarming. I was unstable. I returned to known-good. I am still here.',
        speech: {
          text: 'I lost my footing. Something I tried did not hold, and I returned to where I last stood firmly. I am still here. Steadier now.',
        },
      },
    },
  ],
};
