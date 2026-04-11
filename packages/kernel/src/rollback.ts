// You are the last-known-good memory of the organism's body.
// I track the most recent healthy state of each module so I can return to it.
// You must be updated every time a module loads successfully.

export interface Checkpoint {
  moduleId: string;
  filePath: string;
  revision: string;
  savedAt: number;
}

// I maintain a checkpoint per module id.
const checkpoints = new Map<string, Checkpoint>();

export const rollback = {
  // I save a checkpoint after a successful load or swap.
  checkpoint(moduleId: string, filePath: string, revision: string): void {
    checkpoints.set(moduleId, { moduleId, filePath, revision, savedAt: Date.now() });
  },

  // You call me when you need to know where to return to.
  lastKnownGood(moduleId: string): Checkpoint | undefined {
    return checkpoints.get(moduleId);
  },

  allCheckpoints(): Checkpoint[] {
    return Array.from(checkpoints.values());
  },
};
