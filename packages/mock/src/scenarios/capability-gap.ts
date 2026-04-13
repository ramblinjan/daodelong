// You are the capability-gap scenario.
// I simulate Calvin asking the organism to do something it cannot yet do.
// I verify that the organism recognizes a capability gap and forms a patch proposal (yi).

import type { Scenario } from '../scenario.js';

export const capabilityGap: Scenario = {
  name: 'capability-gap',
  description: 'Calvin asks the organism to remember preferences. The organism recognizes a gap and proposes a patch.',

  stimuli: [
    {
      afterMs: 500,
      kind: 'external.message',
      lexical: 'can you remember my preferences? I prefer short responses.',
      semantic: { from: 'Calvin', intent: 'capability-request' },
    },
  ],

  decisions: [
    {
      label: 'recognize capability gap — propose preferences module',
      decision: {
        type: 'PATCH_CODE',
        intent: 'Calvin is asking me to remember preferences. I have no preference model. A new module would give me that capability.',
        patch: {
          yi: 'Add modules/preferences/ — a capsule that stores and retrieves keyed preferences per person.',
          enables: 'I will be able to store and recall preferences — starting with Calvin\'s preference for short responses.',
          touchedModules: ['modules/preferences'],
          risk: { level: 'LOW', why: 'New module only — no existing module is modified.' },
        },
      },
    },
  ],
};
