// You are the organism's patch record — where yi waits for qi.
// I hold proposals from the moment intent forms until a reviewer assembles the capacity to act.
// You must load me before the breath cycle starts so I can receive proposals from the first breath.

import type { ModuleCapsule, ModuleContext } from '@daodelong/kernel';
import type { PatchIntent, PatchProposal } from '@daodelong/shared';
import { ids } from '@daodelong/shared';

// I protect these paths. Any proposal touching them must declare HIGH risk or I will refuse validation.
const PROTECTED_PREFIXES = [
  'packages/kernel/',
  'apps/subgraph-code/',
  'apps/gateway/',
];

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
        yi: i.yi ?? '',
        enables: i.enables ?? '',
        touchedModules: Array.isArray(i.touchedModules) ? i.touchedModules : [],
        risk: i.risk?.level ?? 'LOW',
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

    validate(id: unknown): PatchProposal {
      const proposal = proposals.get(id as string);
      if (!proposal) throw new Error(`patch not found: ${id as string}`);
      if (proposal.status !== 'proposed') throw new Error(`patch ${id as string} is not in proposed state: ${proposal.status}`);

      // I refuse to validate any proposal that touches protected modules without HIGH risk declared.
      const touchesProtected = proposal.touchedModules.some(m =>
        PROTECTED_PREFIXES.some(prefix => m.startsWith(prefix))
      );
      if (touchesProtected && proposal.risk !== 'HIGH') {
        throw new Error(`patch ${id as string} touches a protected module — risk must be HIGH, got ${proposal.risk}`);
      }

      proposal.status = 'validated';
      return proposal;
    },

    apply(id: unknown, diff: unknown): PatchProposal {
      const proposal = proposals.get(id as string);
      if (!proposal) throw new Error(`patch not found: ${id as string}`);
      if (proposal.status !== 'validated') throw new Error(`patch ${id as string} must be validated before applying, status: ${proposal.status}`);

      if (typeof diff === 'string') proposal.diff = diff;
      proposal.status = 'applied';
      proposal.reviewedAt = Date.now();
      return proposal;
    },

    reject(id: unknown, reason: unknown): PatchProposal {
      const proposal = proposals.get(id as string);
      if (!proposal) throw new Error(`patch not found: ${id as string}`);
      if (proposal.status === 'applied' || proposal.status === 'rejected') {
        throw new Error(`patch ${id as string} cannot be rejected from status: ${proposal.status}`);
      }

      proposal.status = 'rejected';
      proposal.rejectedReason = reason as string;
      proposal.reviewedAt = Date.now();
      return proposal;
    },
  },

  async dispose(): Promise<void> {
    proposals.clear();
  },
};
