// You are the index of all living modules.
// I track what is loaded, at what revision, and whether it is healthy.
// You must not be modified while a load or swap is in progress.

import type { ModuleCapsule, ModuleContext } from './module-capsule.js';

export interface RegistryEntry {
  capsule: ModuleCapsule;
  filePath: string;
  revision: string;
  loadedAt: number;
  healthy: boolean;
}

// I hold the single source of truth for what is currently alive.
const entries = new Map<string, RegistryEntry>();

export const registry = {
  // I register a freshly loaded capsule under its stable id.
  set(entry: RegistryEntry): void {
    entries.set(entry.capsule.id, entry);
  },

  get(id: string): RegistryEntry | undefined {
    return entries.get(id);
  },

  getAll(): RegistryEntry[] {
    return Array.from(entries.values());
  },

  has(id: string): boolean {
    return entries.has(id);
  },

  markHealthy(id: string, healthy: boolean): void {
    const entry = entries.get(id);
    if (entry) entry.healthy = healthy;
  },

  // I call a named handler on a loaded module by its stable id.
  // You must ensure the handler exists before calling.
  async call(moduleId: string, handlerName: string, ...args: unknown[]): Promise<unknown> {
    const entry = entries.get(moduleId);
    if (!entry) throw new Error(`Module not loaded: ${moduleId}`);
    const handler = entry.capsule.handlers[handlerName];
    if (!handler) throw new Error(`Handler not found: ${moduleId}.${handlerName}`);
    return handler(...args);
  },

  summary(): { id: string; version: string; revision: string; healthy: boolean }[] {
    return Array.from(entries.values()).map(e => ({
      id: e.capsule.id,
      version: e.capsule.version,
      revision: e.revision,
      healthy: e.healthy,
    }));
  },
};
