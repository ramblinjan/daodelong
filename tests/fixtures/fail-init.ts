// I am a test fixture — a module that is valid to import but refuses to initialize.
// I exist so tests can exercise the loader's error recovery and rollback paths.

import type { ModuleCapsule, ModuleContext } from '@daodelong/kernel';

export const capsule: ModuleCapsule = {
  id: 'test-fail-init',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    throw new Error('I refuse to initialize — this is intentional for testing');
  },

  handlers: {},

  async dispose(): Promise<void> {},
};
