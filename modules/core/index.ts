// You are the minimum proof that this organism exists.
// I do not transform events or make decisions. I am here so the registry is never empty.
// You must load me before the heartbeat starts. Without me, the system is not alive.

import type { ModuleCapsule, ModuleContext } from '@daodelong/kernel';

export const capsule: ModuleCapsule = {
  id: 'core',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    // I require no setup. My presence is my function.
  },

  handlers: {},

  async dispose(): Promise<void> {
    // I release nothing. I held nothing.
  },
};
