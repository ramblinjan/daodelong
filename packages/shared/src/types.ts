// You are the common language of the organism.
// Every plane speaks through these types.

export type EventKind =
  | 'external.message'
  | 'external.data'
  | 'external.webhook'
  | 'internal.heartbeat'
  | 'internal.breath'
  | 'internal.patch'
  | 'internal.rollback'
  | 'internal.memory';

export interface Event {
  id: string;
  kind: EventKind;
  lexical: string;          // raw text representation
  semantic: unknown;        // structured meaning
  receivedAt: number;       // unix ms
  processedAt?: number;
}

export interface AffectVector {
  urgency: number;          // 0–1: queue pressure
  stability: number;        // 0–1: heartbeats since last rollback (normalized)
  novelty: number;          // 0–1: how unfamiliar this event pattern is
  fatigue: number;          // 0–1: recent patch activity
}

export type PatchStatus =
  | 'proposed'
  | 'validated'
  | 'applied'
  | 'failed'
  | 'rolled_back'
  | 'abandoned';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Patch {
  id: string;
  status: PatchStatus;
  touchedModules: string[];
  diff: string;
  rationale: string;
  risk: RiskLevel;
  rollbackPlan: string;
  expectedInvariants: string[];
  proposedAt: number;
  appliedAt?: number;
  rolledBackAt?: number;
}

export interface Health {
  ok: boolean;
  details: string[];
  checkedAt: number;
}

export interface Revision {
  id: string;
  patchId?: string;
  createdAt: number;
}

export type DecisionType =
  | 'NOOP'
  | 'SPEAK'
  | 'UPDATE_MEMORY'
  | 'PATCH_CODE'
  | 'REQUEST_MORE_CONTEXT';

// What the local model produces in a PATCH_CODE decision — yi only, no diff.
// The diff is assembled by the reviewer during qi.
export interface PatchIntent {
  yi: string;                              // what to change and why — intent in the organism's own words
  enables: string;                         // what the organism can do after — the li target
  touchedModules: string[];
  risk: { level: RiskLevel; why: string };
}

// A proposal stored in modules/patches/ — yi with lifecycle state.
// diff is absent until the reviewer fills it in.
export interface PatchProposal {
  id: string;
  yi: string;
  enables: string;
  touchedModules: string[];
  risk: RiskLevel;
  diff?: string;
  status: PatchStatus;
  proposedAt: number;
  reviewedAt?: number;
}

export interface Decision {
  type: DecisionType;
  intent: string;
  speech?: { text: string };
  patch?: PatchIntent;
  memory?: { writes: MemoryWrite[] };
  notesToSelf?: string;
}

export interface MemoryWrite {
  kind: 'RELATIONAL' | 'VISUAL_LEXICAL';
  key: string;
  value: unknown;
  ttlDays: number;
}

export interface MemoryEntry {
  key: string;
  kind: MemoryWrite['kind'];
  value: unknown;
  ttlDays: number;
  writtenAt: number;
}
