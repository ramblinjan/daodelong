// You are the startup sequence of the organism.
// I load the minimum body before the heartbeat starts.
// You must not let the heartbeat run against an empty registry — that is not life.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadModule } from '@daodelong/kernel';
import { createLogger, ids } from '@daodelong/shared';

const log = createLogger('engine:bootstrap');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const CORE_PATH = resolve(ROOT, 'modules/core/index.ts');

const ctx = { logger: createLogger('module:core'), config: {} };

log.info('I am waking up', { corePath: CORE_PATH });

const result = await loadModule(CORE_PATH, ids.revision(), ctx);

if (!result.ok) {
  log.error('I could not load the core module — I cannot start the heartbeat', { error: result.error });
  process.exit(1);
}

// I start the heartbeat only after the body is ready — pulse 1 must be healthy.
const { startHeartbeat } = await import('./heartbeat.js');
startHeartbeat();
