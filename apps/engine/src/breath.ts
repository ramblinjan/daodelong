// You are the breath cycle of the organism — the medium rhythm where decisions happen.
// I inhale: perceive an event, read my own state, compute affect.
// I exhale: decide, act (or not), verify, learn.
// You must not skip steps. Every breath is a complete cycle even if the decision is NOOP.
// You receive a MindAdapter and a MemoryStore. I do not know which implementations you give me.

import { createLogger, ids } from '@daodelong/shared';
import type { AffectVector, DecisionType, Decision } from '@daodelong/shared';
import type { MindAdapter } from '@daodelong/interfaces';
import type { MemoryStore } from '@daodelong/storage';
import { checkHealth } from '@daodelong/kernel';
import { computeAffect, describeAffect, heartbeatIsHealthy } from './affect.js';
import { currentPulseCount } from './heartbeat.js';
import { drain, depth, oldestAgeMs } from './queue.js';
import { setLastSpeech } from './speech.js';

const log = createLogger('engine:breath');

export interface BreathRecord {
  id: string;
  count: number;
  affect: AffectVector;
  decision: DecisionType;
  ts: number;
  durationMs: number;
}

let breathCount = 0;
const history: BreathRecord[] = [];
const MAX_HISTORY = Number(process.env.BREATH_MAX_HISTORY ?? /* c8 ignore next */ 50);

// I track recent patch proposals to feed the fatigue signal.
const recentPatches: number[] = []; // timestamps of recent patch decisions

export function recentBreaths(n = 5): BreathRecord[] {
  return history.slice(-n);
}

export function currentBreathCount(): number {
  return breathCount;
}

// I am one complete breath: perceive → orient → decide → act → verify → learn.
async function breathe(adapter: MindAdapter, memory: MemoryStore): Promise<void> {
  const start = Date.now();
  breathCount++;
  const breathId = ids.breath();

  log.debug('I inhale', { breath: breathCount });

  // --- PERCEIVE ---
  // I read the queue and drain it before orienting.
  // I also read what I already know — memory entries arrive with me into the decision.
  const events = drain();
  const memoryEntries = memory.readAll();
  const queueDepth = events.length;
  const oldestEventAgeMs = depth() === 0 ? 0 : /* c8 ignore next */ oldestAgeMs(); // residual if any slipped through

  if (events.length > 0) {
    log.info('I perceived events', { breath: breathCount, count: events.length, kinds: events.map(e => e.kind) });
  }
  if (memoryEntries.length > 0) {
    log.debug('I carry memory into this breath', { breath: breathCount, entries: memoryEntries.length });
  }

  // --- ORIENT ---
  const pulse = currentPulseCount();
  const recentPatchCount = recentPatches.filter(t => Date.now() - t < 300_000).length;
  const affect = computeAffect({
    queueDepth,
    oldestEventAgeMs,
    pulsesPerRollback: pulse, // v1: assume no rollbacks yet
    recentPatchCount,
    eventPatternSeen: true,   // v1: assume all patterns seen
  });

  log.info('I orient', { breath: breathCount, affect: describeAffect(affect), pulse });

  // --- DECIDE ---
  // I consult the mind when there are events to process.
  // You must not call the mind when the heartbeat is unhealthy — I default to NOOP.
  let decisionObj: Decision;
  if (events.length === 0) {
    decisionObj = { type: 'NOOP', intent: 'no events — I rest' };
  } else if (!heartbeatIsHealthy()) {
    log.warn('I sense the heartbeat is unhealthy, I prefer NOOP this breath');
    decisionObj = { type: 'NOOP', intent: 'heartbeat unhealthy — I defer' };
  } else {
    decisionObj = await adapter.decide(events, affect, breathCount, memoryEntries);
  }
  const decision: DecisionType = decisionObj.type;
  log.info('I decide', { breath: breathCount, decision, intent: decisionObj.intent });

  // --- ACT ---
  if (decisionObj.type === 'SPEAK' && decisionObj.speech) {
    setLastSpeech({ text: decisionObj.speech.text, breathCount, ts: Date.now() });
    log.info('I speak', { breath: breathCount, text: decisionObj.speech.text });
  }

  // --- VERIFY ---
  const health = checkHealth();
  if (!health.ok) {
    log.warn('I exhale unhealthy', { breath: breathCount, details: health.details });
  }

  // --- LEARN ---
  // I write whatever the mind decided to remember.
  if (decisionObj.memory?.writes) {
    for (const entry of decisionObj.memory.writes) {
      memory.write(entry);
    }
    log.info('I learned', { breath: breathCount, writes: decisionObj.memory.writes.length });
  }

  const durationMs = Date.now() - start;
  const record: BreathRecord = { id: breathId, count: breathCount, affect, decision, ts: start, durationMs };
  history.push(record);
  if (history.length > MAX_HISTORY) history.shift();

  log.debug('I exhale', { breath: breathCount, durationMs });
}

// I fire one breath synchronously for the given adapter without starting a timer.
// You call me in tests to advance breath state on demand.
export async function tick(adapter: MindAdapter, memory: MemoryStore): Promise<void> {
  await breathe(adapter, memory);
}

const DEFAULT_INTERVAL_MS = Number(process.env.BREATH_INTERVAL_MS ?? /* c8 ignore next */ 30_000);

// I start the breath cycle with the given mind adapter and memory store.
// I breathe immediately, then on the configured interval.
// I return a stop function for controlled shutdown.
export function startBreathCycle(adapter: MindAdapter, memory: MemoryStore, intervalMs = DEFAULT_INTERVAL_MS): () => void {
  log.info('I am starting my breath cycle', { intervalMs, mind: adapter.name() });

  breathe(adapter, memory).catch(err => log.error('I failed a breath', { err: String(err) }));
  const handle = setInterval(() => {
    breathe(adapter, memory).catch(err => log.error('I failed a breath', { err: String(err) }));
  }, intervalMs);

  return () => clearInterval(handle);
}
