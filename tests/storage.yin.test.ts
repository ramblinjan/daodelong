// I verify the memory store through its internal state.
// You read me to confirm entries are written, retrieved, and listed correctly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryStore } from '@daodelong/storage';

test('InMemoryStore.read returns undefined for an unknown key', () => {
  const store = new InMemoryStore();
  assert.strictEqual(store.read('no-such-key'), undefined);
});

test('InMemoryStore.write stores an entry and read retrieves it', () => {
  const store = new InMemoryStore();
  store.write({ kind: 'RELATIONAL', key: 'person:jan', value: { role: 'builder' }, ttlDays: 30 });
  const entry = store.read('person:jan');
  assert.ok(entry !== undefined);
  assert.strictEqual(entry!.key, 'person:jan');
  assert.strictEqual(entry!.kind, 'RELATIONAL');
  assert.deepStrictEqual(entry!.value, { role: 'builder' });
  assert.strictEqual(entry!.ttlDays, 30);
  assert.ok(entry!.writtenAt > 0);
});

test('InMemoryStore.write overwrites an existing entry at the same key', () => {
  const store = new InMemoryStore();
  store.write({ kind: 'RELATIONAL', key: 'fact:x', value: 'first', ttlDays: 1 });
  store.write({ kind: 'RELATIONAL', key: 'fact:x', value: 'second', ttlDays: 1 });
  assert.strictEqual(store.read('fact:x')!.value, 'second');
});

test('InMemoryStore.readAll returns all written entries', () => {
  const store = new InMemoryStore();
  store.write({ kind: 'RELATIONAL', key: 'a', value: 1, ttlDays: 1 });
  store.write({ kind: 'VISUAL_LEXICAL', key: 'b', value: 2, ttlDays: 1 });
  const all = store.readAll();
  assert.strictEqual(all.length, 2);
  assert.ok(all.some(e => e.key === 'a'));
  assert.ok(all.some(e => e.key === 'b'));
});

test('InMemoryStore.readAll returns empty array when nothing written', () => {
  const store = new InMemoryStore();
  assert.deepStrictEqual(store.readAll(), []);
});
