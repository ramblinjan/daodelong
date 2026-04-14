// I verify the sensor modules from the outside — what any observer sees.
// I watch the log stream. I do not reach inside.
// You read me to confirm that sensor startup and readings are announced in structured logs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LogEntry } from '@daodelong/shared';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BOOTSTRAP = resolve(ROOT, 'apps/engine/src/sensor-bootstrap.ts');

function observe(): Promise<LogEntry[]> {
  return new Promise((res, rej) => {
    const proc = spawn(process.execPath, ['--import', 'tsx/esm', BOOTSTRAP], {
      cwd: ROOT,
      env: { ...process.env },
    });

    const entries: LogEntry[] = [];
    let buf = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try { entries.push(JSON.parse(line) as LogEntry); } catch { /* non-JSON, skip */ }
      }
    });

    proc.on('close', () => res(entries));
    proc.on('error', rej);
  });
}

test('sensor bootstrap announces module loads', async () => {
  const logs = await observe();
  const msgs = logs.map(e => e.msg);
  assert.ok(msgs.includes('I have loaded a module'), 'missing: I have loaded a module');
});

test('sensor bootstrap loads proximity and environment modules', async () => {
  const logs = await observe();
  const loaded = logs.filter(e => e.msg === 'I have loaded a module');
  const ids = loaded.map(e => (e as LogEntry & { id: string }).id);
  assert.ok(ids.includes('sense/proximity'), 'missing: sense/proximity');
  assert.ok(ids.includes('sense/environment'), 'missing: sense/environment');
});

test('sensor bootstrap produces proximity readings', async () => {
  const logs = await observe();
  const sensed = logs.filter(e => e.msg === 'I sensed');
  const proximity = sensed.filter(e => (e as LogEntry & { kind: string }).kind === 'proximity');
  assert.ok(proximity.length >= 1, `I expected at least 1 proximity reading, got ${proximity.length}`);
});

test('sensor bootstrap produces an environment reading on the 5th tick', async () => {
  const logs = await observe();
  const sensed = logs.filter(e => e.msg === 'I sensed');
  const environment = sensed.filter(e => (e as LogEntry & { kind: string }).kind === 'environment');
  assert.ok(environment.length >= 1, `I expected at least 1 environment reading in 5 ticks, got ${environment.length}`);
});
