// You are the organism's memory — the part of me that persists what I have learned between breaths.
// I own the store and answer when asked what I know.
// You must load me before the breath cycle starts so I can accept writes from the first breath.

import type { ModuleCapsule, ModuleContext } from '@daodelong/kernel';
import type { MemoryWrite } from '@daodelong/shared';
import { InMemoryStore } from '@daodelong/storage';

let store: InMemoryStore;

export const capsule: ModuleCapsule = {
  id: 'memory',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    store = new InMemoryStore();
  },

  handlers: {
    write(entry: unknown): void {
      store.write(entry as MemoryWrite);
    },
    read(key: unknown) {
      return store.read(key as string);
    },
    readAll() {
      return store.readAll();
    },
    getStore() {
      return store;
    },
  },

  async dispose(): Promise<void> {
    // I release nothing. The store is ephemeral and falls away with me.
  },
};
