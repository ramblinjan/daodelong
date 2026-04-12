// You are the contract layer of the organism.
// I define what each replaceable subsystem must be able to do.
// You depend on me. I depend on nothing but shared types.
// Every adapter — local model, cloud model, sandbox patcher — satisfies one of these shapes.

import type { Event, AffectVector, Decision, Patch } from '@daodelong/shared';
import type { EventKind } from '@daodelong/shared';

// I decide what the organism does next.
// You implement me if you are a mind — local model, cloud model, scripted fixture, or silence.
export interface MindAdapter {
  decide(events: Event[], affect: AffectVector, breathCount: number): Promise<Decision>;
  name(): string;
}

// I apply a patch to the organism's body.
// You implement me if you are a patch target — live modules directory or isolated sandbox.
export interface PatchAdapter {
  apply(patch: Patch, targetDir: string): Promise<{ ok: boolean; error?: string }>;
  name(): string;
}

// I am the function shape for injecting events into the queue.
// The scenario player receives me so it does not depend on the engine directly.
export type EnqueueFn = (kind: EventKind, lexical: string, semantic?: unknown) => void;

// I name the modes the organism can run in.
// production — real model, real patches, live everything
// dev        — real model if reachable; silent fallback to NOOP when not
// mock       — scripted model, scenario-driven events, sandbox patches
// test       — mock mode with controlled timing; no intervals, single breath on demand
export type OrganismMode = 'production' | 'dev' | 'mock' | 'test';
