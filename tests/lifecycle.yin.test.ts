// I verify the organism's internal state through its own introspection surfaces.
// I do not observe from outside. I read what the system knows about itself.
// You read me to understand the constraints the system places on its own existence.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { assertCapsule, loadModule, registry, checkHealth } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const ctx = { logger: createLogger('test:yin'), config: {} };

// I confirm the core module is a valid living thing before anything loads it.
test('the core capsule satisfies the module contract', async () => {
  const mod = await import(pathToFileURL(CORE_PATH).href);
  assert.doesNotThrow(() => assertCapsule(mod));
  assert.strictEqual((mod as { capsule: { id: string } }).capsule.id, 'core');
});

// I confirm the registry is no longer empty after core loads.
test('loading core makes the organism non-empty', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  assert.ok(registry.getAll().length > 0, 'registry is still empty after loading core');
});

// I confirm the health invariant is satisfied after core loads.
// This is the minimum condition for the heartbeat to be justified.
test('loading core satisfies the health invariant', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);
  const health = checkHealth();
  assert.strictEqual(
    health.ok,
    true,
    `I am not healthy after loading core: ${health.details.join(', ')}`,
  );
});

// I confirm that the first pulse after loading core carries a healthy report.
// I import heartbeat after loading core so the beat fires into a populated registry.
test('the first pulse after loading core is healthy', async () => {
  await loadModule(CORE_PATH, ids.revision(), ctx);

  const { recentPulses, startHeartbeat, stop } = await import(
    pathToFileURL(resolve(ROOT, 'apps/engine/src/heartbeat.ts')).href
  );

  startHeartbeat();

  try {
    const pulses = recentPulses(1);
    assert.strictEqual(pulses.length, 1, 'I expected one pulse record after startup');
    assert.strictEqual(
      pulses[0].health.ok,
      true,
      `First pulse is unhealthy: ${pulses[0].health.details?.join(', ')}`,
    );
  } finally {
    stop();
  }
});
