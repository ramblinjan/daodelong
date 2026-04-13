// You are the organism's memory store — the place where learned things persist between breaths.
// I hold entries keyed by a string identifier. I report what I know when asked.
// You must not reason here. I only store and retrieve.

import type { MemoryWrite } from '@daodelong/shared';

export interface MemoryEntry {
  key: string;
  kind: MemoryWrite['kind'];
  value: unknown;
  ttlDays: number;
  writtenAt: number;
}

// I define what any memory store must be able to do.
// You implement me to back memory with SQLite, a file, or a remote service.
export interface MemoryStore {
  write(entry: MemoryWrite): void;
  read(key: string): MemoryEntry | undefined;
  readAll(): MemoryEntry[];
}

// I am the in-memory implementation — fast, ephemeral, requires no setup.
// You use me in development and tests. I do not survive a restart.
export class InMemoryStore implements MemoryStore {
  private entries = new Map<string, MemoryEntry>();

  write(entry: MemoryWrite): void {
    this.entries.set(entry.key, {
      key: entry.key,
      kind: entry.kind,
      value: entry.value,
      ttlDays: entry.ttlDays,
      writtenAt: Date.now(),
    });
  }

  read(key: string): MemoryEntry | undefined {
    return this.entries.get(key);
  }

  readAll(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }
}
