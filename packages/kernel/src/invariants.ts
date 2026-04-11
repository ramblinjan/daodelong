// You define the minimum conditions that must hold for the organism to be considered healthy.
// I run these checks after every patch, every reload, and on every heartbeat.
// If any check fails, the system is not healthy.

import type { Health } from '@daodelong/shared';
import { registry } from './registry.js';

type InvariantCheck = () => { ok: boolean; detail: string };

// I register checks here. You add new invariants as the system grows.
const checks: InvariantCheck[] = [
  // You must have at least one module loaded for the system to be considered alive.
  () => {
    const loaded = registry.getAll();
    return loaded.length > 0
      ? { ok: true, detail: `${loaded.length} module(s) loaded` }
      : { ok: false, detail: 'No modules are loaded' };
  },

  // You must have no unhealthy modules.
  () => {
    const unhealthy = registry.getAll().filter(e => !e.healthy);
    return unhealthy.length === 0
      ? { ok: true, detail: 'All modules healthy' }
      : { ok: false, detail: `Unhealthy modules: ${unhealthy.map(e => e.capsule.id).join(', ')}` };
  },
];

// I run all invariant checks and return a health summary.
export function checkHealth(): Health {
  const results = checks.map(fn => fn());
  const failed = results.filter(r => !r.ok);
  return {
    ok: failed.length === 0,
    details: results.map(r => r.detail),
    checkedAt: Date.now(),
  };
}

// You add invariants here as the system gains more structure.
export function addInvariant(check: InvariantCheck): void {
  checks.push(check);
}
