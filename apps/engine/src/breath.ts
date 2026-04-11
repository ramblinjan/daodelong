// You are the breath cycle of the organism — the medium rhythm where decisions happen.
// I inhale: perceive an event, read my own state, compute affect.
// I exhale: decide, act (or not), verify, learn.
// You must not skip steps. Every breath is a complete cycle even if the decision is NOOP.

import { createLogger, ids } from '@daodelong/shared';
import type { AffectVector, DecisionType } from '@daodelong/shared';
import { checkHealth } from '@daodelong/kernel';
import { computeAffect, describeAffect, heartbeatIsHealthy } from './affect.js';
import { currentPulseCount } from './heartbeat.js';

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
const MAX_HISTORY = 50;

// I track recent patch proposals to feed the fatigue signal.
const recentPatches: number[] = []; // timestamps of recent patch decisions

export function recentBreaths(n = 5): BreathRecord[] {
  return history.slice(-n);
}

export function currentBreathCount(): number {
  return breathCount;
}

// I am one complete breath: perceive → orient → decide → act → verify → learn.
// In v1, the decision is structural (NOOP until the GraphQL surface exists).
// You will replace the decide step with a real LLM call once the API is wired.
async function breathe(): Promise<void> {
  const start = Date.now();
  breathCount++;
  const breathId = ids.breath();

  log.debug('I inhale', { breath: breathCount });

  // --- PERCEIVE ---
  // I read the queue and internal state.
  // In v1 this is a stub; subgraph-events will supply real events.
  const queueDepth = 0;
  const oldestEventAgeMs = 0;

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

  if (!heartbeatIsHealthy()) {
    log.warn('I sense the heartbeat is unhealthy, I prefer NOOP this breath');
  }

  // --- DECIDE ---
  // You will replace this stub with a real LLM call.
  // The mind reads: event, self-summary, affect, schema introspection, constraints.
  // The mind outputs a Decision object. In v1 I always NOOP.
  const decision: DecisionType = 'NOOP';
  log.info('I decide', { breath: breathCount, decision });

  // --- ACT ---
  // When decision is PATCH_CODE: propose → validate → apply → reload → verify → rollback
  // When decision is UPDATE_MEMORY: write the memory entry
  // When decision is NOOP: nothing to do

  // --- VERIFY ---
  const health = checkHealth();
  if (!health.ok) {
    log.warn('I exhale unhealthy', { breath: breathCount, details: health.details });
  }

  // --- LEARN ---
  // You will write memory entries here when the memory subgraph exists.

  const durationMs = Date.now() - start;
  const record: BreathRecord = { id: breathId, count: breathCount, affect, decision, ts: start, durationMs };
  history.push(record);
  if (history.length > MAX_HISTORY) history.shift();

  log.debug('I exhale', { breath: breathCount, durationMs });
}

const intervalMs = Number(process.env.BREATH_INTERVAL_MS ?? 30_000);

log.info('I am starting my breath cycle', { intervalMs });

// I breathe immediately on start, then on interval.
breathe().catch(err => log.error('I failed a breath', { err: String(err) }));
setInterval(() => {
  breathe().catch(err => log.error('I failed a breath', { err: String(err) }));
}, intervalMs);
