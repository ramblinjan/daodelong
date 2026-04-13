// You are the organism's patch record — where yi waits for qi.
// I hold proposals from the moment intent forms until a reviewer assembles the capacity to act.
// You must load me before the breath cycle starts so I can receive proposals from the first breath.

import type { ModuleCapsule, ModuleContext } from '@daodelong/kernel';
import type { PatchIntent, PatchProposal } from '@daodelong/shared';
import { ids } from '@daodelong/shared';

const proposals = new Map<string, PatchProposal>();

export const capsule: ModuleCapsule = {
  id: 'patches',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    proposals.clear();
  },

  handlers: {
    propose(intent: unknown): PatchProposal {
      const i = intent as PatchIntent;
      const proposal: PatchProposal = {
        id: ids.patch(),
        yi: i.yi,
        enables: i.enables,
        touchedModules: i.touchedModules,
        risk: i.risk.level,
        status: 'proposed',
        proposedAt: Date.now(),
      };
      proposals.set(proposal.id, proposal);
      return proposal;
    },

    getAll(): PatchProposal[] {
      return Array.from(proposals.values());
    },

    get(id: unknown): PatchProposal | undefined {
      return proposals.get(id as string);
    },
  },

  async dispose(): Promise<void> {
    proposals.clear();
  },
};
