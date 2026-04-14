// You are the sensor pulse loop — the third autonomic rhythm.
// I poll each registered sensor at a configured rate and enqueue what I sense as typed events.
// You run faster than the breath cycle. Readings accumulate in the queue until the next breath drains them.
// You must not run before the sensor modules are loaded.
// I never start automatically. You call startSensorLoop() after sensors are registered.

import { createLogger } from '@daodelong/shared';
import type { EventKind } from '@daodelong/shared';
import { registry } from '@daodelong/kernel';
import type { SensorCapsule } from '@daodelong/kernel';
import { enqueue } from './queue.js';

const log = createLogger('engine:sensor');

const DEFAULT_INTERVAL_MS = Number(process.env.SENSOR_INTERVAL_MS ?? /* c8 ignore next */ 1000);

// I poll all given sensor ids once — a single pass.
// You call me in tests to advance sensor state on demand without starting a timer.
export function tick(sensorIds: string[]): void {
  for (const id of sensorIds) {
    if (!registry.has(id)) continue;
    const entry = registry.get(id)!; // I trust has() — same Map backing get()
    const capsule = entry.capsule as SensorCapsule;
    if (typeof capsule.poll !== 'function') continue;
    const reading = capsule.poll();
    if (!reading) continue;
    const kind = `external.sensor.${reading.kind}` as EventKind;
    enqueue(kind, `${id}: ${JSON.stringify(reading.value)}`, reading);
    log.debug('I sensed', { sensor: id, kind: reading.kind, value: reading.value });
  }
}

// I start the sensor loop. Call me only after sensor modules are loaded.
// I return a stop function for controlled shutdown.
export function startSensorLoop(sensorIds: string[], intervalMs = DEFAULT_INTERVAL_MS): () => void {
  log.info('I am starting my sensor loop', { sensors: sensorIds, intervalMs });
  const handle = setInterval(() => tick(sensorIds), intervalMs);
  return () => clearInterval(handle);
}
