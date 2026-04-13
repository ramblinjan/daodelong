// I verify the queue and speech modules through their internal state.
// You read me to confirm event ingestion, draining, and speech register behaviour.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, drain, depth, oldestAgeMs } from '../apps/engine/src/queue.js';
import { setLastSpeech, getLastSpeech } from '../apps/engine/src/speech.js';

// --- speech ---

test('getLastSpeech returns null before any speech is set', () => {
  // I run early — no breath has fired yet. The register is at its initial value.
  assert.strictEqual(getLastSpeech(), null);
});

test('setLastSpeech stores a speech state and getLastSpeech returns it', () => {
  setLastSpeech({ text: 'I am here.', breathCount: 1, ts: 1000 });
  const s = getLastSpeech();
  assert.ok(s !== null);
  assert.strictEqual(s!.text, 'I am here.');
  assert.strictEqual(s!.breathCount, 1);
  assert.strictEqual(s!.ts, 1000);
});

test('setLastSpeech replaces the previous speech — I am not a log', () => {
  setLastSpeech({ text: 'first', breathCount: 1, ts: 1000 });
  setLastSpeech({ text: 'second', breathCount: 2, ts: 2000 });
  assert.strictEqual(getLastSpeech()!.text, 'second');
});

// --- queue ---

test('depth is zero on a freshly drained queue', () => {
  drain();
  assert.strictEqual(depth(), 0);
});

test('enqueue pushes an event and depth increments', () => {
  drain();
  enqueue('external.message', 'hello world', { text: 'hello world' });
  assert.strictEqual(depth(), 1);
});

test('enqueued event has the expected shape', () => {
  drain();
  const evt = enqueue('external.data', 'payload', { key: 'val' });
  assert.ok(typeof evt.id === 'string' && evt.id.length > 0);
  assert.strictEqual(evt.kind, 'external.data');
  assert.strictEqual(evt.lexical, 'payload');
  assert.deepStrictEqual(evt.semantic, { key: 'val' });
  assert.ok(evt.receivedAt > 0);
  drain();
});

test('drain returns all events and empties the queue', () => {
  drain();
  enqueue('external.message', 'a');
  enqueue('internal.heartbeat', 'b');
  const events = drain();
  assert.strictEqual(events.length, 2);
  assert.strictEqual(depth(), 0);
});

test('drain marks every event as processed', () => {
  drain();
  const before = Date.now();
  enqueue('external.message', 'test');
  const [evt] = drain();
  assert.ok(evt.processedAt! >= before);
});

test('oldestAgeMs returns 0 when the queue is empty', () => {
  drain();
  assert.strictEqual(oldestAgeMs(), 0);
});

test('oldestAgeMs returns a non-negative age when events are waiting', async () => {
  drain();
  enqueue('external.message', 'waiting');
  await new Promise(r => setTimeout(r, 5));
  const age = oldestAgeMs();
  assert.ok(age >= 0);
  drain();
});
