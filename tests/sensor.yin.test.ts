// I verify the sensor modules and sensor pulse loop from the inside.
// You read me to confirm that proximity and environment sensors load, poll, and produce correctly typed events.
// I use tick() to advance the sensor loop without timers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModule, registry } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import type { SensorReading } from '@daodelong/shared';
import type { SensorCapsule } from '@daodelong/kernel';
import { drain, depth } from '../apps/engine/src/queue.js';
import { tick, startSensorLoop } from '../apps/engine/src/sensor.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const PROXIMITY_PATH = resolve(ROOT, 'modules/sense/proximity/index.ts');
const ENVIRONMENT_PATH = resolve(ROOT, 'modules/sense/environment/index.ts');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const ctx = { logger: createLogger('test:sensor'), config: {} };

test('proximity module loads successfully', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const result = await loadModule(PROXIMITY_PATH, ids.revision(), ctx);
  assert.ok(result.ok, 'I expected the proximity module to load');
  assert.ok(registry.has('sense/proximity'));
});

test('proximity capsule has a poll function', () => {
  const entry = registry.get('sense/proximity');
  assert.ok(entry);
  const capsule = entry.capsule as SensorCapsule;
  assert.strictEqual(typeof capsule.poll, 'function');
});

test('proximity poll() returns a reading with distance in [0.1, 2.0]', () => {
  const entry = registry.get('sense/proximity')!;
  const reading = (entry.capsule as SensorCapsule).poll() as SensorReading;
  assert.ok(reading !== null);
  assert.strictEqual(reading.moduleId, 'sense/proximity');
  assert.strictEqual(reading.kind, 'proximity');
  assert.ok(typeof reading.ts === 'number');
  const { distance } = reading.value as { distance: number };
  assert.ok(distance >= 0.1 && distance <= 2.0, `distance ${distance} out of range`);
});

test('environment module loads successfully', async () => {
  const result = await loadModule(ENVIRONMENT_PATH, ids.revision(), ctx);
  assert.ok(result.ok, 'I expected the environment module to load');
  assert.ok(registry.has('sense/environment'));
});

test('environment capsule has a poll function', () => {
  const entry = registry.get('sense/environment');
  assert.ok(entry);
  const capsule = entry.capsule as SensorCapsule;
  assert.strictEqual(typeof capsule.poll, 'function');
});

test('environment poll() returns null on first 4 calls (cadence = 5)', () => {
  const entry = registry.get('sense/environment')!;
  const capsule = entry.capsule as SensorCapsule;
  // I expect null on calls 1–4 within the current 5-poll window.
  // The environment sensor just loaded and init reset pollCount to 0.
  assert.strictEqual(capsule.poll(), null);
  assert.strictEqual(capsule.poll(), null);
  assert.strictEqual(capsule.poll(), null);
  assert.strictEqual(capsule.poll(), null);
});

test('environment poll() returns a reading on the 5th call', () => {
  const entry = registry.get('sense/environment')!;
  const reading = (entry.capsule as SensorCapsule).poll() as SensorReading;
  assert.ok(reading !== null);
  assert.strictEqual(reading.moduleId, 'sense/environment');
  assert.strictEqual(reading.kind, 'environment');
  const { temperature, humidity } = reading.value as { temperature: number; humidity: number };
  assert.ok(temperature >= 18 && temperature <= 25, `temperature ${temperature} out of range`);
  assert.ok(humidity >= 40 && humidity <= 60, `humidity ${humidity} out of range`);
});

test('sensor.tick() enqueues an external.sensor.proximity event', () => {
  drain();
  tick(['sense/proximity']);
  assert.ok(depth() >= 1);
  const events = drain();
  const proxEvent = events.find(e => e.kind === 'external.sensor.proximity');
  assert.ok(proxEvent, 'I expected a proximity event in the queue');
  assert.strictEqual(proxEvent.kind, 'external.sensor.proximity');
  const reading = proxEvent.semantic as SensorReading;
  assert.strictEqual(reading.kind, 'proximity');
});

test('sensor.tick() skips a sensor id not in the registry', () => {
  drain();
  tick(['sense/nonexistent']);
  assert.strictEqual(depth(), 0);
});

test('sensor.tick() skips a module with no poll function', () => {
  // I use the core module — it has no poll handler.
  drain();
  tick(['core']);
  assert.strictEqual(depth(), 0);
});

test('sensor.tick() skips a sensor that returns null', () => {
  // I poll the environment sensor on a non-emit tick (pollCount % 5 !== 0 at this point).
  drain();
  tick(['sense/environment']); // call 6 — pollCount is 6 after the 5-call sequence above, so 6%5 !== 0 → null
  assert.strictEqual(depth(), 0);
});

test('startSensorLoop starts and can be stopped', () => {
  const stop = startSensorLoop(['sense/proximity'], 10_000); // long interval — I stop before it fires
  assert.strictEqual(typeof stop, 'function');
  stop();
});

test('proximity module disposes cleanly', async () => {
  const entry = registry.get('sense/proximity');
  assert.ok(entry);
  await entry.capsule.dispose();
});

test('environment module disposes cleanly', async () => {
  const entry = registry.get('sense/environment');
  assert.ok(entry);
  await entry.capsule.dispose();
});
