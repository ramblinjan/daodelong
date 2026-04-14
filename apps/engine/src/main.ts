// You are the single entry point of the organism.
// I start all planes in the correct order: body first, then senses, then breath.
// You must not reorder these. A face without a heartbeat is a mask. A breath without a body is noise.
// I read ORGANISM_MODE and select the right mind adapter before starting the breath cycle.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadModule, registry } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import type { MindAdapter, OrganismMode } from '@daodelong/interfaces';
import type { MemoryStore } from '@daodelong/storage';
import { LMStudioAdapter } from './mind.js';
import { startHeartbeat } from './heartbeat.js';
import { startBreathCycle } from './breath.js';
import { startSensorLoop } from './sensor.js';
import { enqueue } from './queue.js';

const log = createLogger('engine:main');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const MEMORY_PATH = resolve(ROOT, 'modules/memory/index.ts');
const PATCHES_PATH = resolve(ROOT, 'modules/patches/index.ts');
const PROXIMITY_PATH = resolve(ROOT, 'modules/sense/proximity/index.ts');
const ENVIRONMENT_PATH = resolve(ROOT, 'modules/sense/environment/index.ts');

const ctx = { logger: createLogger('module:core'), config: {} };
const memoryCtx = { logger: createLogger('module:memory'), config: {} };
const patchesCtx = { logger: createLogger('module:patches'), config: {} };
const proximityCtx = { logger: createLogger('module:sense/proximity'), config: {} };
const environmentCtx = { logger: createLogger('module:sense/environment'), config: {} };

const mode = (process.env.ORGANISM_MODE ?? 'dev') as OrganismMode;
log.info('I am waking up', { mode });

// I load the body first. Nothing else starts without it.
const result = await loadModule(CORE_PATH, ids.revision(), ctx);
if (!result.ok) {
  log.error('I could not load the core module — I cannot start', { error: result.error });
  process.exit(1);
}

// I load memory next — it must be ready before the first breath.
const memResult = await loadModule(MEMORY_PATH, ids.revision(), memoryCtx);
if (!memResult.ok) {
  log.error('I could not load the memory module — I cannot start', { error: memResult.error });
  process.exit(1);
}

// I load patches next — it must be ready to receive proposals from the first breath.
const patchResult = await loadModule(PATCHES_PATH, ids.revision(), patchesCtx);
if (!patchResult.ok) {
  log.error('I could not load the patches module — I cannot start', { error: patchResult.error });
  process.exit(1);
}

// I load the sensor modules — they must be ready before the sensor loop starts.
const proximityResult = await loadModule(PROXIMITY_PATH, ids.revision(), proximityCtx);
if (!proximityResult.ok) {
  log.error('I could not load the proximity sensor — I will run without it', { error: proximityResult.error });
}

const environmentResult = await loadModule(ENVIRONMENT_PATH, ids.revision(), environmentCtx);
if (!environmentResult.ok) {
  log.error('I could not load the environment sensor — I will run without it', { error: environmentResult.error });
}

// I start the heartbeat only after the body is loaded — pulse 1 must be healthy.
startHeartbeat();

// I open the face. The organism is now present to the world.
await import('../../face/src/server.js');

// I select the mind adapter for this mode.
// mock and test modes use the scripted MockMindAdapter so no API is called.
// dev and production use the real LM Studio adapter.
let adapter: MindAdapter;

if (mode === 'mock' || mode === 'test') {
  // I load the mock package only when needed — not a production dependency.
  const { MockMindAdapter, ScenarioPlayer, firstContact } = await import('@daodelong/mock');
  adapter = new MockMindAdapter(firstContact.decisions);

  // I start the scenario player so events arrive on schedule.
  const player = new ScenarioPlayer(firstContact, enqueue);
  player.start();

  log.info('I am running with a scripted mind', { scenario: firstContact.name });
} else {
  adapter = new LMStudioAdapter();
  log.info('I am running with the local model', { mind: adapter.name() });
}

// I start the sensor loop — it feeds readings into the queue between breaths.
const sensorIds = ['sense/proximity', 'sense/environment'].filter(id => registry.has(id));
if (sensorIds.length > 0) startSensorLoop(sensorIds);

// I begin breathing. Decisions happen here.
const memory = await registry.call('memory', 'getStore') as MemoryStore;
startBreathCycle(adapter, memory);
