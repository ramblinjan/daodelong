// You are the scripted mind — the organism's reasoning cavity replaced by a known sequence.
// I play back a fixed list of decisions, one per breath that has events to process.
// I do not call any external service. I do not infer. I perform.
// You use me when the goal is to observe the organism's own machinery, not the model's output.

import { createLogger } from '@daodelong/shared';
import type { Event, AffectVector, Decision } from '@daodelong/shared';
import type { MindAdapter } from '@daodelong/interfaces';
import type { ScriptedDecision } from '../scenario.js';

const log = createLogger('mock:mind');

export class MockMindAdapter implements MindAdapter {
  private queue: ScriptedDecision[];
  private cursor = 0;

  // I accept either a static list or a factory that generates decisions dynamically.
  constructor(decisions: ScriptedDecision[]) {
    this.queue = decisions;
  }

  name(): string {
    return 'mock';
  }

  async decide(events: Event[], affect: AffectVector, breathCount: number): Promise<Decision> {
    if (this.cursor >= this.queue.length) {
      log.debug('I have no more scripted decisions — I rest', { breath: breathCount });
      return { type: 'NOOP', intent: 'scripted sequence exhausted — I rest' };
    }

    const scripted = this.queue[this.cursor++];
    log.debug('I play a scripted decision', {
      breath: breathCount,
      label: scripted.label ?? `decision-${this.cursor}`,
      type: scripted.decision.type,
    });

    return scripted.decision;
  }

  // I report how many decisions remain unplayed.
  remaining(): number {
    return Math.max(0, this.queue.length - this.cursor);
  }

  // I reset to the beginning of the sequence.
  reset(): void {
    this.cursor = 0;
  }
}
