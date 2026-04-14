// You are a minimal startup for sensor yang testing.
// I load core and both sensor modules, run 5 sensor ticks, then exit.
// I exist so the yang test can observe sensor lifecycle messages from outside.
// You do not run me in production. I am not part of the normal startup sequence.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';
import { tick } from './sensor.js';

const log = createLogger('engine:sensor-bootstrap');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');
const PROXIMITY_PATH = resolve(ROOT, 'modules/sense/proximity/index.ts');
const ENVIRONMENT_PATH = resolve(ROOT, 'modules/sense/environment/index.ts');
const ctx = { logger: createLogger('module'), config: {} };

await loadModule(CORE_PATH, ids.revision(), ctx);
await loadModule(PROXIMITY_PATH, ids.revision(), ctx);
await loadModule(ENVIRONMENT_PATH, ids.revision(), ctx);

log.info('I am starting sensor ticks');

// I run 5 ticks — enough to produce proximity events and one environment event.
for (let i = 0; i < 5; i++) {
  tick(['sense/proximity', 'sense/environment']);
}

log.info('I have finished sensor ticks');
