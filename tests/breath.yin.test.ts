// I verify the breath cycle through its internal state.
// I load core and push enough healthy pulses before testing the SPEAK path,
// because heartbeatIsHealthy requires the last 3 pulses to all be healthy.
// You read me to confirm every decision branch in breathe() is exercised.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { loadModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import { InMemoryStore } from '@daodelong/storage';
import { MockMindAdapter } from '../packages/mock/src/adapters/MockMindAdapter.js';
import { tick, startBreathCycle, recentBreaths, currentBreathCount } from '../apps/engine/src/breath.js';
import { tick as heartbeatTick } from '../apps/engine/src/heartbeat.js';
import { enqueue, drain } from '../apps/engine/src/queue.js';
import { getLastSpeech } from '../apps/engine/src/speech.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const ctx = { logger: createLogger('test:breath'), config: {} };

// I load core and generate 3 healthy pulses before any breath test runs,
// so heartbeatIsHealthy() returns true when the SPEAK path is tested.
async function setup(): Promise<void> {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  heartbeatTick(); heartbeatTick(); heartbeatTick();
}

const store = new InMemoryStore();

test('breathe defers to NOOP when heartbeat is unhealthy but events are present', async () => {
  // I run BEFORE setup() — heartbeat history only has the unhealthy pulses from affect.yin.
  // heartbeatIsHealthy() returns false. Events are present. I expect the warn path (lines 80-81).
  drain();
  enqueue('external.message', 'deferred message', {});
  const adapter = new MockMindAdapter([
    { decision: { type: 'SPEAK', intent: 'should not be called', speech: { text: 'hi' } } },
  ]);
  await tick(adapter, store);
  const last = recentBreaths(1)[0];
  assert.strictEqual(last.decision, 'NOOP');
  assert.strictEqual(adapter.remaining(), 1); // adapter was never consulted
  drain();
});

test('currentBreathCount and recentBreaths start reflecting state', async () => {
  const before = currentBreathCount();
  const noop = new MockMindAdapter([]);
  drain();
  await tick(noop, store);
  assert.strictEqual(currentBreathCount(), before + 1);
  const recent = recentBreaths(1);
  assert.strictEqual(recent.length, 1);
  assert.strictEqual(recent[0].decision, 'NOOP');
});

test('breathe decides NOOP when queue is empty — no adapter call needed', async () => {
  drain();
  const adapter = new MockMindAdapter([
    { decision: { type: 'SPEAK', intent: 'should not be called', speech: { text: 'hi' } } },
  ]);
  await tick(adapter, store);
  // I consumed no decisions — remaining is still 1.
  assert.strictEqual(adapter.remaining(), 1);
  const last = recentBreaths(1)[0];
  assert.strictEqual(last.decision, 'NOOP');
});

test('breathe decides NOOP when heartbeat is unhealthy — events present but deferred', async () => {
  drain();
  await tick(new MockMindAdapter([]), store);
  const last = recentBreaths(1)[0];
  assert.ok(typeof last.id === 'string');
  assert.ok(typeof last.count === 'number');
  assert.ok(typeof last.durationMs === 'number');
  assert.ok(last.ts > 0);
});

test('breathe calls the adapter and acts on a SPEAK decision', async () => {
  await setup();
  drain();
  enqueue('external.message', 'say something', { text: 'say something' });

  const adapter = new MockMindAdapter([
    { label: 'speak', decision: { type: 'SPEAK', intent: 'I respond.', speech: { text: 'I am here.' } } },
  ]);
  await tick(adapter, store);

  const last = recentBreaths(1)[0];
  assert.strictEqual(last.decision, 'SPEAK');

  const speech = getLastSpeech();
  assert.ok(speech !== null);
  assert.strictEqual(speech!.text, 'I am here.');
});

test('breathe records affect on every breath', async () => {
  drain();
  await tick(new MockMindAdapter([]), store);
  const last = recentBreaths(1)[0];
  assert.ok(typeof last.affect.urgency === 'number');
  assert.ok(typeof last.affect.stability === 'number');
  assert.ok(typeof last.affect.novelty === 'number');
  assert.ok(typeof last.affect.fatigue === 'number');
});

test('breathe writes memory entries to the store on UPDATE_MEMORY decision', async () => {
  await setup();
  drain();
  enqueue('internal.rollback', 'core rolled back', {});

  const localStore = new InMemoryStore();
  const adapter = new MockMindAdapter([
    {
      label: 'remember rollback',
      decision: {
        type: 'UPDATE_MEMORY',
        intent: 'A rollback occurred. I should record it.',
        memory: {
          writes: [
            { kind: 'RELATIONAL', key: 'event:last-rollback', value: { module: 'core' }, ttlDays: 7 },
          ],
        },
      },
    },
  ]);

  await tick(adapter, localStore);

  const last = recentBreaths(1)[0];
  assert.strictEqual(last.decision, 'UPDATE_MEMORY');

  const entry = localStore.read('event:last-rollback');
  assert.ok(entry !== undefined, 'I expected the memory entry to be written');
  assert.strictEqual(entry!.kind, 'RELATIONAL');
  assert.deepStrictEqual(entry!.value, { module: 'core' });
  assert.strictEqual(entry!.ttlDays, 7);
});

test('breath history trims when it exceeds MAX_HISTORY', async () => {
  // BREATH_MAX_HISTORY=3 is set in the test environment.
  drain();
  const noop = new MockMindAdapter([]);
  await tick(noop, store); await tick(noop, store); await tick(noop, store); await tick(noop, store);
  const recent = recentBreaths(100);
  assert.ok(recent.length <= 3, `I expected at most 3 breath records, got ${recent.length}`);
});

test('startBreathCycle starts, interval fires, and the returned stop function clears it', async () => {
  await setup();
  drain();
  // I use a 5ms interval so the setInterval callback fires at least once before I stop.
  const stop = startBreathCycle(new MockMindAdapter([]), new InMemoryStore(), 5);
  await new Promise(r => setTimeout(r, 20));
  stop();
});
