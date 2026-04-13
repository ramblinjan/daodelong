// I verify the mock layer through its internal state.
// You read me to confirm scripted decisions and scenario stimulus injection behave correctly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockMindAdapter } from '../packages/mock/src/adapters/MockMindAdapter.js';
import { ScenarioPlayer } from '../packages/mock/src/player.js';
import type { AffectVector } from '@daodelong/shared';

const CALM: AffectVector = { urgency: 0, stability: 1, novelty: 0.1, fatigue: 0 };

// --- MockMindAdapter ---

test('MockMindAdapter.name returns "mock"', () => {
  assert.strictEqual(new MockMindAdapter([]).name(), 'mock');
});

test('MockMindAdapter plays scripted decisions in order', async () => {
  const adapter = new MockMindAdapter([
    { label: 'speak', decision: { type: 'SPEAK', intent: 'I greet the world.', speech: { text: 'Hello.' } } },
    { label: 'rest',  decision: { type: 'NOOP',  intent: 'I have nothing more to say.' } },
  ]);
  const d1 = await adapter.decide([], CALM, 1);
  const d2 = await adapter.decide([], CALM, 2);
  assert.strictEqual(d1.type, 'SPEAK');
  assert.strictEqual(d2.type, 'NOOP');
});

test('MockMindAdapter returns NOOP when the scripted sequence is exhausted', async () => {
  const adapter = new MockMindAdapter([
    { decision: { type: 'SPEAK', intent: 'I speak once.', speech: { text: 'Once.' } } },
  ]);
  await adapter.decide([], CALM, 1); // consume
  const d = await adapter.decide([], CALM, 2);
  assert.strictEqual(d.type, 'NOOP');
  assert.ok(d.intent.includes('exhausted'));
});

test('MockMindAdapter.remaining tracks unplayed decisions', async () => {
  const adapter = new MockMindAdapter([
    { decision: { type: 'NOOP', intent: 'a' } },
    { decision: { type: 'NOOP', intent: 'b' } },
  ]);
  assert.strictEqual(adapter.remaining(), 2);
  await adapter.decide([], CALM, 1);
  assert.strictEqual(adapter.remaining(), 1);
  await adapter.decide([], CALM, 2);
  assert.strictEqual(adapter.remaining(), 0);
});

test('MockMindAdapter.reset replays the sequence from the beginning', async () => {
  const adapter = new MockMindAdapter([
    { decision: { type: 'SPEAK', intent: 'I return.', speech: { text: 'Again.' } } },
  ]);
  await adapter.decide([], CALM, 1); // consume
  adapter.reset();
  assert.strictEqual(adapter.remaining(), 1);
  const d = await adapter.decide([], CALM, 2);
  assert.strictEqual(d.type, 'SPEAK');
});

// --- ScenarioPlayer ---

test('ScenarioPlayer.start injects all stimuli via the enqueue function', async () => {
  const received: string[] = [];
  const mockEnqueue = (_kind: string, lexical: string) => { received.push(lexical); };

  const player = new ScenarioPlayer(
    {
      name: 'greeting',
      description: 'A simple greeting scenario for testing.',
      stimuli: [
        { kind: 'external.message', lexical: 'hello', afterMs: 0 },
        { kind: 'external.message', lexical: 'world', afterMs: 0 },
      ],
      decisions: [],
    },
    mockEnqueue as Parameters<typeof ScenarioPlayer>[1],
  );

  player.start();
  await new Promise(r => setTimeout(r, 20));

  assert.strictEqual(received.length, 2);
  assert.ok(received.includes('hello'));
  assert.ok(received.includes('world'));
});

test('ScenarioPlayer.stop cancels stimuli that have not yet fired', async () => {
  const received: string[] = [];
  const mockEnqueue = (_kind: string, lexical: string) => { received.push(lexical); };

  const player = new ScenarioPlayer(
    {
      name: 'slow-scenario',
      description: 'A scenario with a delayed stimulus to test cancellation.',
      stimuli: [
        { kind: 'external.message', lexical: 'should-not-arrive', afterMs: 200 },
      ],
      decisions: [],
    },
    mockEnqueue as Parameters<typeof ScenarioPlayer>[1],
  );

  player.start();
  player.stop();
  await new Promise(r => setTimeout(r, 250));

  assert.strictEqual(received.length, 0);
});
