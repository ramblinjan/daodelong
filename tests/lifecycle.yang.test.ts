// I verify the organism's lifecycle from the outside — what any observer sees.
// I watch the log stream. I do not reach inside.
// You read me to confirm that what is happening inside is also being communicated outward.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LogEntry } from '@daodelong/shared';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const TSX = resolve(ROOT, 'node_modules/.bin/tsx');
const BOOTSTRAP = resolve(ROOT, 'apps/engine/src/bootstrap.ts');

// I spawn bootstrap and collect its log stream for a fixed window.
// I parse each line as a log entry — the organism speaks only in structured JSON.
function observe(durationMs: number): Promise<LogEntry[]> {
  return new Promise((res, rej) => {
    const proc = spawn(TSX, [BOOTSTRAP], {
      cwd: ROOT,
      env: { ...process.env, HEARTBEAT_INTERVAL_MS: '100' },
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

    setTimeout(() => { proc.kill(); res(entries); }, durationMs);
    proc.on('error', rej);
  });
}

// I confirm that loading a module and starting the heartbeat are both announced.
test('bootstrap announces the full load lifecycle', async () => {
  const logs = await observe(500);
  const msgs = logs.map(e => e.msg);

  assert.ok(msgs.includes('I am loading a module'),    'missing: I am loading a module');
  assert.ok(msgs.includes('I have loaded a module'),   'missing: I have loaded a module');
  assert.ok(msgs.includes('I am starting my heartbeat'), 'missing: I am starting my heartbeat');
});

// I confirm that the module announced as loaded identifies itself as core.
test('the loaded module announces itself as core', async () => {
  const logs = await observe(400);
  const loaded = logs.find(e => e.msg === 'I have loaded a module');
  assert.ok(loaded, 'I never saw a load confirmation');
  assert.strictEqual((loaded as LogEntry & { id: string }).id, 'core');
});

// I confirm that beats are happening and none of them report illness.
// If I see "I am not healthy", the invariant was violated — the heartbeat is not justified.
test('the heartbeat beats clean — no health warnings', async () => {
  const logs = await observe(600); // ~5 beats at 100ms interval
  const beats    = logs.filter(e => e.msg === 'I beat');
  const warnings = logs.filter(e => e.msg === 'I am not healthy');

  assert.ok(beats.length >= 2, `I expected at least 2 beats, got ${beats.length}`);
  assert.strictEqual(warnings.length, 0, `I am not healthy was logged ${warnings.length} time(s)`);
});
