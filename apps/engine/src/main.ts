// You are the single entry point of the organism.
// I start all planes in the correct order: body first, then senses, then breath.
// You must not reorder these. A face without a heartbeat is a mask. A breath without a body is noise.
// I read ORGANISM_MODE and select the right mind adapter before starting the breath cycle.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import type { MindAdapter, OrganismMode } from '@daodelong/interfaces';
import { InMemoryStore } from '@daodelong/storage';
import { LMStudioAdapter } from './mind.js';
import { startHeartbeat } from './heartbeat.js';
import { startBreathCycle } from './breath.js';
import { enqueue } from './queue.js';

const log = createLogger('engine:main');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');

const ctx = { logger: createLogger('module:core'), config: {} };

const mode = (process.env.ORGANISM_MODE ?? 'dev') as OrganismMode;
log.info('I am waking up', { mode });

// I load the body first. Nothing else starts without it.
const result = await loadModule(CORE_PATH, ids.revision(), ctx);
if (!result.ok) {
  log.error('I could not load the core module — I cannot start', { error: result.error });
  process.exit(1);
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

// I begin breathing. Decisions happen here.
const memory = new InMemoryStore();
startBreathCycle(adapter, memory);
