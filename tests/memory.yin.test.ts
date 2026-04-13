// I verify the memory module capsule — its init, handlers, and the remembers query surface.
// You read me to confirm the organism's recall system is wired correctly.
// I run before mind.yin and resolvers.yin so the module is loaded for downstream tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModule, registry } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import { resolvers } from '../apps/face/src/resolvers.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const MEMORY_PATH = resolve(ROOT, 'modules/memory/index.ts');
const ctx = { logger: createLogger('test:memory'), config: {} };

test('Query.remembers returns null when memory module is not yet loaded', async () => {
  // I run before loadModule so registry.has('memory') is false here — covers that branch.
  const result = await resolvers.Query.remembers({}, { key: 'any:key' });
  assert.strictEqual(result, null);
});

test('memory module loads successfully', async () => {
  const result = await loadModule(MEMORY_PATH, ids.revision(), ctx);
  assert.ok(result.ok, `I expected the memory module to load`);
  assert.ok(registry.has('memory'));
});

test('memory.getStore returns the store instance', async () => {
  const store = await registry.call('memory', 'getStore');
  assert.ok(store !== null && typeof store === 'object');
});

test('memory.read returns undefined for an unknown key', async () => {
  const result = await registry.call('memory', 'read', 'nonexistent:key');
  assert.strictEqual(result, undefined);
});

test('memory.write stores an entry, memory.read retrieves it', async () => {
  await registry.call('memory', 'write', {
    key: 'test:greeting',
    kind: 'RELATIONAL',
    value: { name: 'Calvin' },
    ttlDays: 30,
  });
  const entry = await registry.call('memory', 'read', 'test:greeting') as Record<string, unknown>;
  assert.ok(entry !== undefined);
  assert.strictEqual(entry.key, 'test:greeting');
  assert.strictEqual(entry.kind, 'RELATIONAL');
  assert.deepStrictEqual(entry.value, { name: 'Calvin' });
  assert.strictEqual(entry.ttlDays, 30);
  assert.ok(typeof entry.writtenAt === 'number');
});

test('memory.readAll returns all stored entries', async () => {
  const all = await registry.call('memory', 'readAll') as unknown[];
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 1);
});

test('Query.remembers returns null for an unknown key', async () => {
  const result = await resolvers.Query.remembers({}, { key: 'missing:entry' });
  assert.strictEqual(result, null);
});

test('memory module disposes cleanly', async () => {
  const entry = registry.get('memory');
  assert.ok(entry);
  await entry.capsule.dispose();
});

test('Query.remembers returns the entry after it has been written', async () => {
  await registry.call('memory', 'write', {
    key: 'event:last-rollback',
    kind: 'RELATIONAL',
    value: { module: 'core' },
    ttlDays: 7,
  });
  const result = await resolvers.Query.remembers({}, { key: 'event:last-rollback' });
  assert.ok(result !== null);
  assert.strictEqual(result!.key, 'event:last-rollback');
  assert.strictEqual(result!.kind, 'RELATIONAL');
  assert.strictEqual(result!.value, JSON.stringify({ module: 'core' }));
  assert.strictEqual(result!.ttlDays, 7);
  assert.ok(typeof result!.writtenAt === 'number');
});
