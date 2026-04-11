// You are the autonomic pulse of the organism.
// I beat unconditionally. I am not blocked by event processing or decision cycles.
// I check vitals on every pulse and emit a record so the breath cycle can observe me.
// You must not add business logic here. I exist only to keep the organism alive and aware.

import { createLogger, ids } from '@daodelong/shared';
import { checkHealth } from '@daodelong/kernel';

const log = createLogger('engine:heartbeat');

export interface PulseRecord {
  id: string;
  count: number;
  health: Awaited<ReturnType<typeof checkHealth>>;
  ts: number;
}

let pulseCount = 0;
const history: PulseRecord[] = [];
const MAX_HISTORY = 100;

// I expose pulse history so the breath cycle can read recent vitals.
export function recentPulses(n = 10): PulseRecord[] {
  return history.slice(-n);
}

export function currentPulseCount(): number {
  return pulseCount;
}

function beat(): void {
  pulseCount++;
  const health = checkHealth();
  const record: PulseRecord = { id: ids.pulse(), count: pulseCount, health, ts: Date.now() };

  history.push(record);
  if (history.length > MAX_HISTORY) history.shift();

  if (!health.ok) {
    log.warn('I am not healthy', { pulse: pulseCount, details: health.details });
  } else {
    log.debug('I beat', { pulse: pulseCount });
  }
}

const intervalMs = Number(process.env.HEARTBEAT_INTERVAL_MS ?? 5000);

log.info('I am starting my heartbeat', { intervalMs });
beat(); // I beat immediately on start, not after the first interval.
const timer = setInterval(beat, intervalMs);

// You may stop the heartbeat cleanly for testing.
// In production I should never stop.
export function stop(): void {
  clearInterval(timer);
  log.info('I have stopped my heartbeat');
}
