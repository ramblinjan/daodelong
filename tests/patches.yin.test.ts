// I verify the patches module capsule — its init, handlers, and the full patch lifecycle mutations.
// You read me to confirm that yi lands, qi advances through validate → apply or reject, and the organism perceives the outcome.
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
import { drain, enqueue, depth } from '../apps/engine/src/queue.js';
import { resolvers } from '../apps/face/src/resolvers.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const PATCHES_PATH = resolve(ROOT, 'modules/patches/index.ts');
const MEMORY_PATH = resolve(ROOT, 'modules/memory/index.ts');
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

test('Mutation.validatePatch throws when patches module is not loaded', async () => {
  await assert.rejects(
    () => resolvers.Mutation.validatePatch({}, { id: 'ptch_any' }),
    /patches module is not loaded/,
  );
});

test('Mutation.applyPatch throws when patches module is not loaded', async () => {
  await assert.rejects(
    () => resolvers.Mutation.applyPatch({}, { id: 'ptch_any' }),
    /patches module is not loaded/,
  );
});

test('Mutation.rejectPatch throws when patches module is not loaded', async () => {
  await assert.rejects(
    () => resolvers.Mutation.rejectPatch({}, { id: 'ptch_any', reason: 'not needed' }),
    /patches module is not loaded/,
  );
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

test('patches.propose applies defensive defaults when model omits optional fields', async () => {
  // I guard against a model that produces a PATCH_CODE decision without all fields.
  const proposal = await registry.call('patches', 'propose', {
    yi: undefined,
    enables: undefined,
    touchedModules: null,
    risk: undefined,
  }) as PatchProposal;

  assert.strictEqual(proposal.yi, '');
  assert.strictEqual(proposal.enables, '');
  assert.deepStrictEqual(proposal.touchedModules, []);
  assert.strictEqual(proposal.risk, 'LOW');
  assert.strictEqual(proposal.status, 'proposed');
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

// --- Lifecycle mutations ---

test('patches.validate advances status to validated for a safe proposal', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add greeting variants.',
    enables: 'I will be able to vary my greetings.',
    touchedModules: ['modules/greetings'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  const validated = await registry.call('patches', 'validate', proposal.id) as PatchProposal;
  assert.strictEqual(validated.status, 'validated');
});

test('patches.validate throws for a kernel-touching proposal with non-HIGH risk', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Modify the registry.',
    enables: 'I will have a faster lookup.',
    touchedModules: ['packages/kernel/src/registry.ts'],
    risk: { level: 'LOW', why: 'Small change.' },
  }) as PatchProposal;

  await assert.rejects(
    () => registry.call('patches', 'validate', proposal.id),
    /protected module/,
  );
  // I confirm the proposal is still in proposed state after a failed validation.
  const still = await registry.call('patches', 'get', proposal.id) as PatchProposal;
  assert.strictEqual(still.status, 'proposed');
});

test('patches.validate throws for an unknown patch id', async () => {
  await assert.rejects(
    () => registry.call('patches', 'validate', 'ptch_unknown'),
    /patch not found/,
  );
});

test('patches.validate throws if the proposal is not in proposed state', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a timer.',
    enables: 'I will be able to schedule things.',
    touchedModules: ['modules/timer'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await registry.call('patches', 'validate', proposal.id);
  // I attempt to validate again — the proposal is now in 'validated' state, not 'proposed'.
  await assert.rejects(
    () => registry.call('patches', 'validate', proposal.id),
    /is not in proposed state/,
  );
});

test('patches.apply throws for an unknown patch id', async () => {
  await assert.rejects(
    () => registry.call('patches', 'apply', 'ptch_unknown'),
    /patch not found/,
  );
});

test('patches.reject throws for an unknown patch id', async () => {
  await assert.rejects(
    () => registry.call('patches', 'reject', 'ptch_unknown', 'no reason'),
    /patch not found/,
  );
});

test('patches.apply stores the diff and marks the proposal applied', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a farewell message.',
    enables: 'I will be able to say goodbye.',
    touchedModules: ['modules/farewell'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await registry.call('patches', 'validate', proposal.id);
  const applied = await registry.call('patches', 'apply', proposal.id, 'diff --git a/modules/farewell/index.ts ...') as PatchProposal;

  assert.strictEqual(applied.status, 'applied');
  assert.ok(applied.diff?.includes('diff --git'));
  assert.ok(typeof applied.reviewedAt === 'number');
});

test('patches.apply throws if the proposal has not been validated', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add something.',
    enables: 'I will be able to do something.',
    touchedModules: ['modules/something'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await assert.rejects(
    () => registry.call('patches', 'apply', proposal.id),
    /must be validated/,
  );
});

test('patches.reject marks the proposal rejected with a reason', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add something risky.',
    enables: 'I will be able to do something risky.',
    touchedModules: ['modules/risky'],
    risk: { level: 'HIGH', why: 'Potentially disruptive.' },
  }) as PatchProposal;

  const rejected = await registry.call('patches', 'reject', proposal.id, 'The yi is too vague to implement safely.') as PatchProposal;
  assert.strictEqual(rejected.status, 'rejected');
  assert.strictEqual(rejected.rejectedReason, 'The yi is too vague to implement safely.');
  assert.ok(typeof rejected.reviewedAt === 'number');
});

test('Mutation.validatePatch advances the proposal via the GraphQL surface', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a status reporter.',
    enables: 'I will be able to report my internal status on demand.',
    touchedModules: ['modules/status-reporter'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  const result = await resolvers.Mutation.validatePatch({}, { id: proposal.id });
  assert.strictEqual(result.status, 'validated');
});

test('Mutation.applyPatch applies the proposal and enqueues an internal.patch event', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a mood narrator.',
    enables: 'I will be able to narrate my affect in prose.',
    touchedModules: ['modules/narrator'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await resolvers.Mutation.validatePatch({}, { id: proposal.id });
  drain(); // I clear any queued events before applying so I can count the new one.

  const result = await resolvers.Mutation.applyPatch({}, { id: proposal.id, diff: '+export function narrate() {}' });
  assert.strictEqual(result.status, 'applied');
  assert.strictEqual(result.diff, '+export function narrate() {}');

  // I confirm the feedback event landed in the queue.
  assert.ok(depth() >= 1);
});

test('Mutation.rejectPatch rejects the proposal and enqueues an internal.patch event', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Rewrite the heartbeat.',
    enables: 'I will have a faster heartbeat.',
    touchedModules: ['modules/heartbeat-v2'],
    risk: { level: 'LOW', why: 'New module.' },
  }) as PatchProposal;

  drain();
  const result = await resolvers.Mutation.rejectPatch({}, { id: proposal.id, reason: 'The heartbeat is already adequate.' });
  assert.strictEqual(result.status, 'rejected');
  assert.strictEqual(result.rejectedReason, 'The heartbeat is already adequate.');

  assert.ok(depth() >= 1);
});

test('Mutation.applyPatch writes outcome to memory when memory module is loaded', async () => {
  await loadModule(MEMORY_PATH, ids.revision(), ctx);

  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a log compressor.',
    enables: 'I will be able to compact long logs.',
    touchedModules: ['modules/log-compressor'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await resolvers.Mutation.validatePatch({}, { id: proposal.id });
  await resolvers.Mutation.applyPatch({}, { id: proposal.id, diff: '+export function compact() {}' });

  // I confirm the outcome was written to memory.
  const entry = await registry.call('memory', 'read', `patch.${proposal.id}.outcome`);
  assert.ok(entry !== undefined);
});

test('Mutation.rejectPatch writes outcome to memory when memory module is loaded', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add a log decompressor.',
    enables: 'I will be able to decompress logs.',
    touchedModules: ['modules/log-decompressor'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  drain();
  await resolvers.Mutation.rejectPatch({}, { id: proposal.id, reason: 'Not needed yet.' });

  const entry = await registry.call('memory', 'read', `patch.${proposal.id}.outcome`);
  assert.ok(entry !== undefined);
});

test('patches.reject throws when the proposal is already rejected', async () => {
  const proposal = await registry.call('patches', 'propose', {
    yi: 'Add something else.',
    enables: 'I will be able to do something else.',
    touchedModules: ['modules/something-else'],
    risk: { level: 'LOW', why: 'New module only.' },
  }) as PatchProposal;

  await registry.call('patches', 'reject', proposal.id, 'Too vague.');

  await assert.rejects(
    () => registry.call('patches', 'reject', proposal.id, 'Trying again.'),
    /cannot be rejected/,
  );
});

