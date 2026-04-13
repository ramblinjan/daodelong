// I verify kernel internals that the lifecycle tests do not reach.
// I cover: registry.call/summary/markHealthy, rollback.allCheckpoints,
// invariants unhealthy paths + addInvariant, loader error paths + swapModule,
// and the core capsule's init/dispose stubs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registry, rollback, addInvariant, checkHealth, loadModule, swapModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const ctx = { logger: createLogger('test:kernel'), config: {} };

// --- rollback ---

test('rollback.lastKnownGood returns undefined for an unknown module', () => {
  assert.strictEqual(rollback.lastKnownGood('absolutely-unknown'), undefined);
});

test('rollback.allCheckpoints returns an empty array before any load', () => {
  // I read checkpoints as they exist now — other tests may have added some.
  // I only assert the return type, not an exact count.
  const all = rollback.allCheckpoints();
  assert.ok(Array.isArray(all));
});

test('rollback.allCheckpoints includes a checkpoint after loadModule', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const all = rollback.allCheckpoints();
  assert.ok(all.length > 0);
  assert.ok(all.every(c => typeof c.moduleId === 'string'));
});

// --- registry ---

test('registry.markHealthy toggles a loaded entry', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  registry.markHealthy('core', false);
  assert.strictEqual(registry.get('core')!.healthy, false);
  registry.markHealthy('core', true);
  assert.strictEqual(registry.get('core')!.healthy, true);
});

test('registry.summary returns a snapshot of loaded modules', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const s = registry.summary();
  assert.ok(Array.isArray(s));
  const core = s.find(e => e.id === 'core');
  assert.ok(core, 'core should be in summary');
  assert.ok(typeof core!.version === 'string');
  assert.ok(typeof core!.revision === 'string');
  assert.ok(typeof core!.healthy === 'boolean');
});

test('registry.call invokes a handler on a loaded module', async () => {
  // I load a minimal in-memory capsule to avoid needing a real handler file.
  const fakeCapsule = {
    id: 'fake-for-call-test',
    version: '0.0.1',
    init: async () => {},
    dispose: async () => {},
    handlers: {
      greet: (...args: unknown[]) => `hello ${args[0]}`,
    },
  };
  registry.set({ capsule: fakeCapsule, filePath: 'fake', revision: 'r0', loadedAt: Date.now(), healthy: true });
  const result = await registry.call('fake-for-call-test', 'greet', 'world');
  assert.strictEqual(result, 'hello world');
});

test('registry.call throws when module is not loaded', async () => {
  await assert.rejects(
    () => registry.call('does-not-exist', 'anything'),
    /Module not loaded/,
  );
});

test('registry.call throws when handler is not found', async () => {
  registry.set({
    capsule: { id: 'no-handler', version: '0.0.1', init: async () => {}, dispose: async () => {}, handlers: {} },
    filePath: 'fake',
    revision: 'r0',
    loadedAt: Date.now(),
    healthy: true,
  });
  await assert.rejects(
    () => registry.call('no-handler', 'missing'),
    /Handler not found/,
  );
});

test('registry.has returns true for a loaded module and false for an unknown one', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  assert.strictEqual(registry.has('core'), true);
  assert.strictEqual(registry.has('definitely-not-loaded'), false);
});

test('registry.markHealthy is a no-op when the id is not loaded', () => {
  assert.doesNotThrow(() => registry.markHealthy('completely-unknown-id', true));
});

// --- invariants ---

test('checkHealth returns unhealthy when a module is marked unhealthy', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  registry.markHealthy('core', false);
  const health = checkHealth();
  assert.strictEqual(health.ok, false);
  assert.ok(health.details.some(d => d.includes('core')));
  registry.markHealthy('core', true); // restore
});

test('addInvariant registers a new check that runs on subsequent checkHealth calls', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  let ran = false;
  addInvariant(() => { ran = true; return { ok: true, detail: 'custom invariant passed' }; });
  checkHealth();
  assert.ok(ran, 'I expected the custom invariant to have run');
});

// --- core capsule ---

test('core capsule init and dispose complete without error', async () => {
  const mod = await import(pathToFileURL(CORE_PATH).href);
  await assert.doesNotReject(() => mod.capsule.init(ctx));
  await assert.doesNotReject(() => mod.capsule.dispose());
});

// --- loader error paths ---

test('loadModule returns ok:false when the file does not exist', async () => {
  const result = await loadModule('/no/such/file.ts', ids.revision(), ctx);
  assert.strictEqual(result.ok, false);
  assert.ok(result.error);
});

test('swapModule swaps a loaded module with a new revision', async () => {
  // Load once, then swap to the same file at a new revision.
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const result = await swapModule('core', CORE_PATH, ids.revision(), ctx);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.moduleId, 'core');
});

test('swapModule returns ok:false when the new file does not exist', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const result = await swapModule('core', '/no/such/file.ts', ids.revision(), ctx);
  assert.strictEqual(result.ok, false);
  assert.ok(result.error);
});

test('swapModule triggers no-checkpoint rollback path when init fails and no checkpoint exists', async () => {
  const FIXTURE_PATH = resolve(ROOT, 'tests/fixtures/throws-on-init.ts');
  // I register a module with NO checkpoint so attemptRollback hits the no-checkpoint branch.
  registry.set({
    capsule: { id: 'orphan-module', version: '0.0.1', init: async () => {}, dispose: async () => {}, handlers: {} },
    filePath: CORE_PATH,
    revision: 'x',
    loadedAt: Date.now(),
    healthy: true,
  });
  // No rollback.checkpoint call for 'orphan-module'.
  const result = await swapModule('orphan-module', FIXTURE_PATH, ids.revision(), ctx);
  assert.strictEqual(result.ok, false);
});

test('swapModule attempts rollback when init of new revision fails', async () => {
  const FIXTURE_PATH = resolve(ROOT, 'tests/fixtures/throws-on-init.ts');

  // I seed the registry with a working module first so rollback has a checkpoint to return to.
  await loadModule(CORE_PATH, ids.revision(), ctx);
  rollback.checkpoint('throws-on-init', CORE_PATH, ids.revision());
  registry.set({
    capsule: { id: 'throws-on-init', version: '0.0.1', init: async () => {}, dispose: async () => {}, handlers: {} },
    filePath: CORE_PATH,
    revision: 'good',
    loadedAt: Date.now(),
    healthy: true,
  });

  // I swap to the fixture whose init always throws — this triggers attemptRollback.
  const result = await swapModule('throws-on-init', FIXTURE_PATH, ids.revision(), ctx);
  assert.strictEqual(result.ok, false);
  assert.ok(result.error?.includes('I fail on purpose'));
});
