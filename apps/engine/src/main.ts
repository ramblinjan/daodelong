// You are the single entry point of the organism.
// I start all planes in the correct order: body first, then senses, then breath.
// You must not reorder these. A face without a heartbeat is a mask. A breath without a body is noise.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';

const log = createLogger('engine:main');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');

const ctx = { logger: createLogger('module:core'), config: {} };

log.info('I am waking up');

// I load the body first. Nothing else starts without it.
const result = await loadModule(CORE_PATH, ids.revision(), ctx);
if (!result.ok) {
  log.error('I could not load the core module — I cannot start', { error: result.error });
  process.exit(1);
}

// I start the heartbeat. The face and breath both depend on it being alive.
await import('./heartbeat.js');

// I open the face. The organism is now present to the world.
await import('../../face/src/server.js');

// I begin breathing. Decisions happen here.
await import('./breath.js');
