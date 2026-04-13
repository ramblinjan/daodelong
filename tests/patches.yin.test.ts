// I verify the patches module capsule — its init, handlers, and the proposedPatches query surface.
// You read me to confirm that yi lands and waits correctly before qi assembles.
// I run before queue.yin and resolvers.yin so the module is loaded for downstream tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModule, registry } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import type { PatchProposal } from '@daodelong/shared';
import { InMemoryStore } from '@daodelong/storage';
import { MockMindAdapter } from '../packages/mock/src/adapters/MockMindAdapter.js';
import { tick } from '../apps/engine/src/breath.js';
import { tick as heartbeatTick } from '../apps/engine/src/heartbeat.js';
import { drain, enqueue } from '../apps/engine/src/queue.js';
import { resolvers } from '../apps/face/src/resolvers.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const PATCHES_PATH = resolve(ROOT, 'modules/patches/index.ts');
const ctx = { logger: createLogger('test:patches'), config: {} };

async function setup(): Promise<void> {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  heartbeatTick(); heartbeatTick(); heartbeatTick();
}

test('Query.proposedPatches returns empty array when patches module is not yet loaded', async () => {
  const result = await resolvers.Query.proposedPatches();
  assert.deepStrictEqual(result, []);
});

test('PATCH_CODE breath is silent when patches module is not yet loaded', async () => {
  await setup();
  drain();
  enqueue('external.message', 'can you do something new?', {});
  const store = new InMemoryStore();
  await tick(new MockMindAdapter([{
    decision: {
      type: 'PATCH_CODE',
      intent: 'I sense a gap.',
      patch: {
        yi: 'Add something.',
        enables: 'I will be able to do something.',
        touchedModules: ['modules/something'],
        risk: { level: 'LOW', why: 'New module only.' },
      },
    },
  }]), store);
  // I expect no crash — the branch is gracefully skipped when patches is not loaded.
});

test('patches module loads successfully', async () => {
  const result = await loadModule(PATCHES_PATH, ids.revision(), ctx);
  assert.ok(result.ok, 'I expected the patches module to load');
  assert.ok(registry.has('patches'));
});

test('patches module disposes cleanly', async () => {
  const entry = registry.get('patches');
  assert.ok(entry);
  await entry.capsule.dispose();
});

test('patches.propose stores a proposal and returns it', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add modules/preferences/ to store per-person preferences.',
    enables: 'I will be able to recall preferences when someone speaks to me.',
    touchedModules: ['modules/preferences'],
    risk: { level: 'LOW', why: 'New module only — nothing existing is modified.' },
  }) as PatchProposal;

  assert.ok(proposal.id.startsWith('ptch_'));
  assert.strictEqual(proposal.yi, 'Add modules/preferences/ to store per-person preferences.');
  assert.ok(proposal.enables.includes('preferences'));
  assert.deepStrictEqual(proposal.touchedModules, ['modules/preferences']);
  assert.strictEqual(proposal.risk, 'LOW');
  assert.strictEqual(proposal.status, 'proposed');
  assert.ok(typeof proposal.proposedAt === 'number');
  assert.strictEqual(proposal.diff, undefined);
  assert.strictEqual(proposal.reviewedAt, undefined);
});

test('patches.getAll returns all stored proposals', async () => {
  const all = await registry.call('patches', 'getAll') as PatchProposal[];
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 1);
});

test('patches.get retrieves a proposal by id', async () => {
  const all = await registry.call('patches', 'getAll') as PatchProposal[];
  const first = all[0];
  const found = await registry.call('patches', 'get', first.id) as PatchProposal;
  assert.strictEqual(found.id, first.id);
});

test('patches.get returns undefined for an unknown id', async () => {
  const result = await registry.call('patches', 'get', 'ptch_unknown');
  assert.strictEqual(result, undefined);
});

test('Query.proposedPatches returns proposals after module is loaded', async () => {
  const result = await resolvers.Query.proposedPatches();
  assert.ok(Array.isArray(result));
  assert.ok(result.length >= 1);
  assert.ok(result[0].id.startsWith('ptch_'));
});

test('PATCH_CODE breath stores a proposal via the patches module', async () => {
  await setup();
  drain();
  enqueue('external.message', 'can you remember my preferences?', { from: 'Calvin' });

  const store = new InMemoryStore();
  await tick(new MockMindAdapter([{
    label: 'recognize capability gap',
    decision: {
      type: 'PATCH_CODE',
      intent: 'Calvin wants preference storage. I have no preference model.',
      patch: {
        yi: 'Add modules/preferences/ to store per-person preferences.',
        enables: 'I will be able to recall Calvin\'s preference for short responses.',
        touchedModules: ['modules/preferences'],
        risk: { level: 'LOW', why: 'New module only.' },
      },
    },
  }]), store);

  const all = await registry.call('patches', 'getAll') as PatchProposal[];
  const latest = all[all.length - 1];
  assert.strictEqual(latest.status, 'proposed');
  assert.ok(latest.enables.includes('preference'));
});
