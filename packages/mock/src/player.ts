// You are the scenario player — the mechanism that injects scripted stimuli into the queue.
// I do not know what the organism will decide. I only supply what it perceives.
// You give me an enqueue function. I call it on schedule. The organism does the rest.

import { createLogger } from '@daodelong/shared';
import type { EnqueueFn } from '@daodelong/interfaces';
import type { Scenario, Stimulus } from './scenario.js';

const log = createLogger('mock:player');

export class ScenarioPlayer {
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private scenario: Scenario,
    private enqueue: EnqueueFn,
  ) {}

  // I schedule all stimuli and return immediately.
  // The organism receives each event at the designated delay from now.
  start(): void {
    log.info('I begin a scenario', { name: this.scenario.name });

    for (const stimulus of this.scenario.stimuli) {
      const timer = setTimeout(() => {
        log.debug('I inject a stimulus', {
          scenario: this.scenario.name,
          kind: stimulus.kind,
          lexical: stimulus.lexical.slice(0, 60),
        });
        this.enqueue(stimulus.kind, stimulus.lexical, stimulus.semantic ?? {});
      }, stimulus.afterMs);

      this.timers.push(timer);
    }
  }

  // I cancel any pending stimuli that have not yet fired.
  stop(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    log.info('I stopped the scenario', { name: this.scenario.name });
  }
}
