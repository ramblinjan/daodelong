// I am a test fixture — a valid capsule whose init always throws.
// You load me via swapModule to exercise the init-fail → attemptRollback path.

import type { ModuleCapsule } from '@daodelong/kernel';

export const capsule: ModuleCapsule = {
  id: 'throws-on-init',
  version: '0.0.1',
  async init(): Promise<void> {
    throw new Error('I fail on purpose — I am testing the rollback path.');
  },
  handlers: {},
  async dispose(): Promise<void> {},
};
