// You define what it means to be a living module in this organism.
// Every patchable module must satisfy this contract to be loaded, swapped, or disposed.
// If you do not satisfy it, I will refuse to load you.

import type { Logger } from '@daodelong/shared';

export interface ModuleContext {
  logger: Logger;
  config: Record<string, unknown>;
}

// You must export a capsule with this shape.
// Your id must be stable across revisions — it is how I find you.
// Your version should change with each meaningful patch.
export interface ModuleCapsule {
  id: string;
  version: string;
  init(ctx: ModuleContext): Promise<void>;
  handlers: Record<string, (...args: unknown[]) => unknown>;
  dispose(): Promise<void>;
}

// You use this to verify a loaded module satisfies the capsule contract before I trust it.
export function assertCapsule(mod: unknown): asserts mod is { capsule: ModuleCapsule } {
  if (!mod || typeof mod !== 'object') throw new Error('Module export is not an object');
  const m = mod as Record<string, unknown>;
  if (!m.capsule || typeof m.capsule !== 'object') throw new Error('Module must export a named "capsule"');
  const c = m.capsule as Record<string, unknown>;
  if (typeof c.id !== 'string') throw new Error('capsule.id must be a string');
  if (typeof c.version !== 'string') throw new Error('capsule.version must be a string');
  if (typeof c.init !== 'function') throw new Error('capsule.init must be a function');
  if (typeof c.dispose !== 'function') throw new Error('capsule.dispose must be a function');
  if (!c.handlers || typeof c.handlers !== 'object') throw new Error('capsule.handlers must be an object');
}
