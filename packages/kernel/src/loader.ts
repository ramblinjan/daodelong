// You load living modules from source files and swap them while the system runs.
// I use versioned file paths so Node's ESM cache never interferes with a fresh load.
// You must always call dispose() on the old capsule before init() on the new one.

import { pathToFileURL } from 'node:url';
import { createLogger } from '@daodelong/shared';
import { assertCapsule, type ModuleContext } from './module-capsule.js';
import { registry } from './registry.js';
import { rollback } from './rollback.js';

const log = createLogger('kernel:loader');

export interface LoadResult {
  ok: boolean;
  moduleId: string;
  revision: string;
  error?: string;
}

// I load a module from the given file path for the first time.
// I register it and call init before returning.
export async function loadModule(
  filePath: string,
  revision: string,
  ctx: ModuleContext,
): Promise<LoadResult> {
  const url = versionedUrl(filePath, revision);
  log.info('I am loading a module', { filePath, revision });

  try {
    const mod = await import(url);
    assertCapsule(mod);
    const { capsule } = mod;

    await capsule.init(ctx);
    registry.set({ capsule, filePath, revision, loadedAt: Date.now(), healthy: true });
    rollback.checkpoint(capsule.id, filePath, revision);

    log.info('I have loaded a module', { id: capsule.id, version: capsule.version });
    return { ok: true, moduleId: capsule.id, revision };
  } catch (err) {
    const error = String(err);
    log.error('I failed to load a module', { filePath, revision, error });
    return { ok: false, moduleId: '', revision, error };
  }
}

// I hot-swap a running module with a new revision.
// I dispose the old capsule first. If the new one fails init, I attempt rollback.
export async function swapModule(
  moduleId: string,
  newFilePath: string,
  newRevision: string,
  ctx: ModuleContext,
): Promise<LoadResult> {
  const existing = registry.get(moduleId);
  const url = versionedUrl(newFilePath, newRevision);
  log.info('I am swapping a module', { moduleId, newRevision });

  let mod: unknown;
  try {
    mod = await import(url);
    assertCapsule(mod);
  } catch (err) {
    const error = String(err);
    log.error('I could not import the new revision', { moduleId, error });
    return { ok: false, moduleId, revision: newRevision, error };
  }

  const { capsule: newCapsule } = mod as { capsule: Parameters<typeof assertCapsule>[0] & { capsule: NonNullable<unknown> } } & { capsule: import('./module-capsule.js').ModuleCapsule };
  // dispose old
  if (existing) {
    try { await existing.capsule.dispose(); } catch (_) { /* I note but do not stop here */ }
  }

  try {
    await (mod as { capsule: import('./module-capsule.js').ModuleCapsule }).capsule.init(ctx);
    registry.set({
      capsule: (mod as { capsule: import('./module-capsule.js').ModuleCapsule }).capsule,
      filePath: newFilePath,
      revision: newRevision,
      loadedAt: Date.now(),
      healthy: true,
    });
    rollback.checkpoint(moduleId, newFilePath, newRevision);
    log.info('I have swapped a module', { moduleId, newRevision });
    return { ok: true, moduleId, revision: newRevision };
  } catch (err) {
    const error = String(err);
    log.error('I failed to init the new revision, I will attempt rollback', { moduleId, error });
    await attemptRollback(moduleId, ctx);
    return { ok: false, moduleId, revision: newRevision, error };
  }
}

async function attemptRollback(moduleId: string, ctx: ModuleContext): Promise<void> {
  const checkpoint = rollback.lastKnownGood(moduleId);
  if (!checkpoint) {
    log.error('I have no checkpoint to roll back to', { moduleId });
    registry.markHealthy(moduleId, false);
    return;
  }
  log.warn('I am rolling back to last known good', { moduleId, revision: checkpoint.revision });
  await loadModule(checkpoint.filePath, checkpoint.revision, ctx);
}

// I append a version token to the file URL to guarantee a fresh import.
function versionedUrl(filePath: string, revision: string): string {
  const base = pathToFileURL(filePath).href;
  return `${base}?v=${revision}`;
}
