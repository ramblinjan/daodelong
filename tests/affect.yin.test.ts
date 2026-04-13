// I verify the affect and heartbeat systems through their internal state.
// I run before core is loaded (alphabetical order: 'a' < 'l').
// You read me to confirm affect computation and the unhealthy heartbeat path are correct.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAffect, describeAffect, heartbeatIsHealthy } from '../apps/engine/src/affect.js';
import { currentPulseCount, recentPulses, startHeartbeat, tick, stop } from '../apps/engine/src/heartbeat.js';

// --- resolvers: waking-up path (must run before any breath.tick is ever called) ---
// I run first alphabetically. No breath has fired yet — recentBreaths returns empty.

import { resolvers } from '../apps/face/src/resolvers.js';

test('Query.recent returns the waking-up placeholder before any breath has occurred', () => {
  const recent = resolvers.Query.recent();
  assert.strictEqual(recent.length, 1);
  assert.strictEqual(recent[0].when, 'just now');
  assert.strictEqual(recent[0].what, 'I am waking up.');
});

test('Query.hello.mood returns "I have not yet found my pulse." before any heartbeat', () => {
  // No ticks yet — recentPulses is empty.
  assert.strictEqual(resolvers.Query.hello().mood, 'I have not yet found my pulse.');
});

test('Query.hello.age returns "I have not yet beaten." before any heartbeat', () => {
  // currentPulseCount() is 0.
  assert.strictEqual(resolvers.Query.hello().age, 'I have not yet beaten.');
});

test('Query.speech returns null before any speech is set', () => {
  // lastSpeech is null — the !s branch in speech().
  assert.strictEqual(resolvers.Query.speech(), null);
});

// --- heartbeat gaps ---

test('currentPulseCount starts at zero', () => {
  assert.strictEqual(currentPulseCount(), 0);
});

test('heartbeatIsHealthy returns false when no pulses recorded', () => {
  assert.strictEqual(heartbeatIsHealthy(), false);
});

test('a tick with empty registry records an unhealthy pulse', () => {
  // I have no modules loaded yet — the invariant fails, the beat is unhealthy.
  tick();
  const pulses = recentPulses(1);
  assert.strictEqual(pulses.length, 1);
  assert.strictEqual(pulses[0].health.ok, false);
  assert.ok(currentPulseCount() >= 1);
});

test('Query.hello.age uses singular "heartbeat" and omits breaths when breathCount is zero', () => {
  // After exactly 1 tick and 0 breaths, age() hits the singular branch and the no-breaths branch.
  const age = resolvers.Query.hello().age;
  assert.ok(age.includes('1 heartbeat'), `expected "1 heartbeat" in "${age}"`);
  assert.ok(!age.includes('breath'), `expected no "breath" in "${age}" when breathCount is 0`);
});

test('heartbeatIsHealthy returns false after only unhealthy pulses', () => {
  assert.strictEqual(heartbeatIsHealthy(), false);
});

test('history trims when it exceeds MAX_HISTORY', () => {
  // HEARTBEAT_MAX_HISTORY=3 is set in the test environment.
  // I have already ticked once above. Two more ticks will reach the limit.
  // A fourth tick triggers the shift.
  tick(); tick(); tick();
  const pulses = recentPulses(100);
  assert.ok(pulses.length <= 3, `I expected at most 3 pulses, got ${pulses.length}`);
});

test('startHeartbeat and stop complete without error', () => {
  startHeartbeat(999_999);
  stop();
});

// --- computeAffect ---

test('computeAffect: calm state — low urgency, full stability, low novelty, zero fatigue', () => {
  const v = computeAffect({ queueDepth: 0, oldestEventAgeMs: 0, pulsesPerRollback: 200, recentPatchCount: 0, eventPatternSeen: true });
  assert.strictEqual(v.urgency, 0);
  assert.strictEqual(v.stability, 1);
  assert.strictEqual(v.novelty, 0.1);
  assert.strictEqual(v.fatigue, 0);
});

test('computeAffect: deep queue raises urgency', () => {
  const v = computeAffect({ queueDepth: 20, oldestEventAgeMs: 0, pulsesPerRollback: 200, recentPatchCount: 0, eventPatternSeen: true });
  assert.ok(v.urgency > 0.4);
});

test('computeAffect: old event raises urgency', () => {
  const v = computeAffect({ queueDepth: 0, oldestEventAgeMs: 300_000, pulsesPerRollback: 200, recentPatchCount: 0, eventPatternSeen: true });
  assert.ok(v.urgency > 0.4);
});

test('computeAffect: novel event pattern raises novelty to 0.9', () => {
  const v = computeAffect({ queueDepth: 0, oldestEventAgeMs: 0, pulsesPerRollback: 200, recentPatchCount: 0, eventPatternSeen: false });
  assert.strictEqual(v.novelty, 0.9);
});

test('computeAffect: recent patches raise fatigue', () => {
  const v = computeAffect({ queueDepth: 0, oldestEventAgeMs: 0, pulsesPerRollback: 200, recentPatchCount: 10, eventPatternSeen: true });
  assert.strictEqual(v.fatigue, 1);
});

test('computeAffect: zero pulses per rollback yields zero stability', () => {
  const v = computeAffect({ queueDepth: 0, oldestEventAgeMs: 0, pulsesPerRollback: 0, recentPatchCount: 0, eventPatternSeen: true });
  assert.strictEqual(v.stability, 0);
});

test('computeAffect: urgency is clamped to 1', () => {
  const v = computeAffect({ queueDepth: 1000, oldestEventAgeMs: 999_999, pulsesPerRollback: 0, recentPatchCount: 0, eventPatternSeen: true });
  assert.strictEqual(v.urgency, 1);
});

// --- describeAffect ---

test('describeAffect: baseline state is "calm and stable"', () => {
  assert.strictEqual(
    describeAffect({ urgency: 0, stability: 1, novelty: 0.1, fatigue: 0 }),
    'calm and stable',
  );
});

test('describeAffect: high urgency includes "urgent"', () => {
  const d = describeAffect({ urgency: 0.8, stability: 1, novelty: 0.1, fatigue: 0 });
  assert.ok(d.includes('urgent'));
});

test('describeAffect: low stability includes "unstable"', () => {
  const d = describeAffect({ urgency: 0, stability: 0.2, novelty: 0.1, fatigue: 0 });
  assert.ok(d.includes('unstable'));
});

test('describeAffect: high novelty includes "encountering novelty"', () => {
  const d = describeAffect({ urgency: 0, stability: 1, novelty: 0.9, fatigue: 0 });
  assert.ok(d.includes('encountering novelty'));
});

test('describeAffect: high fatigue includes "fatigued"', () => {
  const d = describeAffect({ urgency: 0, stability: 1, novelty: 0.1, fatigue: 0.8 });
  assert.ok(d.includes('fatigued'));
});

test('describeAffect: all extremes produces all four descriptors', () => {
  const d = describeAffect({ urgency: 1, stability: 0, novelty: 1, fatigue: 1 });
  assert.ok(d.includes('urgent'));
  assert.ok(d.includes('unstable'));
  assert.ok(d.includes('encountering novelty'));
  assert.ok(d.includes('fatigued'));
});
