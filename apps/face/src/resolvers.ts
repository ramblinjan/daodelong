// You are the translation layer — interior state rendered as plain language.
// I speak as the organism. I do not expose kernel types or affect vectors directly.
// I read real state from the heartbeat and affect systems.

import { checkHealth } from '@daodelong/kernel';
import { currentPulseCount, recentPulses } from '../../engine/src/heartbeat.js';
import { currentBreathCount, recentBreaths } from '../../engine/src/breath.js';
import { computeAffect, describeAffect } from '../../engine/src/affect.js';
import { enqueue, depth, oldestAgeMs } from '../../engine/src/queue.js';
import { getLastSpeech } from '../../engine/src/speech.js';

function mood(): string {
  const pulses = recentPulses(3);
  const queueDepth = depth();
  const recentPatchCount = 0;

  if (pulses.length === 0) return 'I have not yet found my pulse.';

  const pulsesPerRollback = currentPulseCount(); // v1: no rollbacks yet
  const affect = computeAffect({
    queueDepth,
    oldestEventAgeMs: oldestAgeMs(),
    pulsesPerRollback,
    recentPatchCount,
    eventPatternSeen: true,
  });

  return describeAffect(affect);
}

function age(): string {
  const pulses = currentPulseCount();
  const breaths = currentBreathCount();
  if (pulses === 0) return 'I have not yet beaten.';
  const parts = [`${pulses} heartbeat${pulses === 1 ? '' : 's'}`];
  if (breaths > 0) parts.push(`${breaths} breath${breaths === 1 ? /* c8 ignore next */ '' : 's'}`);
  return `I have taken ${parts.join(' and ')}.`;
}

export const resolvers = {
  Query: {
    hello: () => {
      const health = checkHealth();
      return {
        name: 'daodelong',
        nature: 'I am a living system. I have a heartbeat, a breath cycle, and a body that can change while I am alive.',
        alive: health.ok,
        mood: mood(),
        age: age(),
      };
    },

    recent: () => {
      const breaths = recentBreaths(5);
      if (breaths.length === 0) {
        return [{ when: 'just now', what: 'I am waking up.' }];
      }
      return breaths.map(b => ({
        when: `breath ${b.count}`,
        what: `I decided to ${b.decision.toLowerCase().replace('_', ' ')}. I felt ${describeAffect(b.affect)}.`,
      }));
    },

    speech: () => {
      const s = getLastSpeech();
      if (!s) return null;
      return {
        said: s.text,
        when: `breath ${s.breathCount}`,
      };
    },
  },

  Mutation: {
    say: (_: unknown, { text }: { text: string }) => {
      enqueue('external.message', text, { text });
      return {
        heard: true,
        echo: `I received your words. I will hold them until my next breath.`,
      };
    },
  },
};
