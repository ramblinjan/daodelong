// You are the shape of a scripted situation the organism can be placed into.
// A scenario is two channels: stimuli (what enters the queue) and decisions (what the mind returns).
// I run both channels simultaneously. The breath cycle connects them, as it always does.

import type { Decision } from '@daodelong/shared';
import type { EventKind } from '@daodelong/shared';

// I describe one event the scenario will inject into the queue after a delay.
export interface Stimulus {
  afterMs: number;          // delay from scenario start
  kind: EventKind;
  lexical: string;
  semantic?: unknown;
}

// I describe one decision the mock mind will return, in order, for each breath that has events.
// The intent and speech should be written as the organism itself would reason and speak.
export interface ScriptedDecision {
  decision: Decision;
  label?: string;           // human-readable label for test assertions and logging
}

// I am a complete named situation the organism can inhabit.
export interface Scenario {
  name: string;
  description: string;
  stimuli: Stimulus[];
  decisions: ScriptedDecision[];
}
