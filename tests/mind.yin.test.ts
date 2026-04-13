// I verify the LMStudioAdapter through its internal decision logic.
// I replace global fetch with a controlled stub so no real network calls happen.
// You read me to confirm good responses, bad HTTP, network errors, and parse failures are all handled.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { LMStudioAdapter } from '../apps/engine/src/mind.js';
import type { AffectVector, Event } from '@daodelong/shared';

const CALM: AffectVector = { urgency: 0, stability: 1, novelty: 0.1, fatigue: 0 };
const NO_EVENTS: Event[] = [];

function fakeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

function fakeBadResponse(status: number): Response {
  return { ok: false, status } as unknown as Response;
}

test('LMStudioAdapter.name includes the model string', () => {
  const adapter = new LMStudioAdapter('http://localhost:1234', 'test-model');
  assert.ok(adapter.name().includes('test-model'));
});

test('LMStudioAdapter returns the parsed Decision on a good response', async () => {
  const decision = { type: 'SPEAK', intent: 'I greet the world.', speech: { text: 'Hello.' } };
  mock.method(globalThis, 'fetch', async () => fakeOkResponse({
    choices: [{ message: { content: JSON.stringify(decision) } }],
  }));

  const adapter = new LMStudioAdapter();
  const result = await adapter.decide(NO_EVENTS, CALM, 1);
  assert.strictEqual(result.type, 'SPEAK');
  assert.strictEqual(result.intent, 'I greet the world.');
  mock.restoreAll();
});

test('LMStudioAdapter returns NOOP on a bad HTTP status', async () => {
  mock.method(globalThis, 'fetch', async () => fakeBadResponse(503));

  const adapter = new LMStudioAdapter();
  const result = await adapter.decide(NO_EVENTS, CALM, 1);
  assert.strictEqual(result.type, 'NOOP');
  assert.ok(result.intent.includes('unreachable'));
  mock.restoreAll();
});

test('LMStudioAdapter returns NOOP when fetch throws a network error', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('ECONNREFUSED'); });

  const adapter = new LMStudioAdapter();
  const result = await adapter.decide(NO_EVENTS, CALM, 1);
  assert.strictEqual(result.type, 'NOOP');
  assert.ok(result.intent.includes('unreachable'));
  mock.restoreAll();
});

test('LMStudioAdapter returns NOOP when the response is not valid JSON', async () => {
  mock.method(globalThis, 'fetch', async () => fakeOkResponse({
    choices: [{ message: { content: 'not json at all' } }],
  }));

  const adapter = new LMStudioAdapter();
  const result = await adapter.decide(NO_EVENTS, CALM, 1);
  assert.strictEqual(result.type, 'NOOP');
  assert.ok(result.intent.includes('parse failure'));
  mock.restoreAll();
});

test('LMStudioAdapter returns NOOP when choices content is null', async () => {
  mock.method(globalThis, 'fetch', async () => fakeOkResponse({
    choices: [{ message: { content: null } }],
  }));

  const adapter = new LMStudioAdapter();
  const result = await adapter.decide(NO_EVENTS, CALM, 1);
  assert.strictEqual(result.type, 'NOOP');
  assert.ok(result.intent.includes('parse failure'));
  mock.restoreAll();
});

test('LMStudioAdapter builds the user message from events and affect', async () => {
  let capturedBody: unknown;
  mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    capturedBody = JSON.parse(init.body as string);
    return fakeOkResponse({ choices: [{ message: { content: JSON.stringify({ type: 'NOOP', intent: 'x' }) } }] });
  });

  const events: Event[] = [
    { id: 'e1', kind: 'external.message', lexical: 'hello', semantic: {}, receivedAt: Date.now() },
  ];
  const adapter = new LMStudioAdapter();
  await adapter.decide(events, CALM, 5);

  const body = capturedBody as { messages: { role: string; content: string }[] };
  const userMsg = body.messages.find(m => m.role === 'user')!.content;
  assert.ok(userMsg.includes('Breath: 5'));
  assert.ok(userMsg.includes('hello'));
  mock.restoreAll();
});
