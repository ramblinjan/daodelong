// You compute the felt sense of the organism's current state.
// I read internal signals and produce a normalized vector before every decision.
// You must not reason or decide here. I only sense and report.

import type { AffectVector } from '@daodelong/shared';
import { recentPulses } from './heartbeat.js';

export interface AffectContext {
  queueDepth: number;
  oldestEventAgeMs: number;
  pulsesPerRollback: number;   // higher = more stable
  recentPatchCount: number;    // patches in last 10 breath cycles
  eventPatternSeen: boolean;   // true if this event kind was seen recently
}

// I compute affect from observable system state.
// Each dimension is normalized to 0–1.
export function computeAffect(ctx: AffectContext): AffectVector {
  // Urgency rises with queue depth and event age.
  const urgency = clamp(
    (ctx.queueDepth / 20) * 0.5 +
    (Math.min(ctx.oldestEventAgeMs, 300_000) / 300_000) * 0.5
  );

  // Stability rises with time since last rollback (up to 200 pulses = fully stable).
  const stability = clamp(Math.min(ctx.pulsesPerRollback, 200) / 200);

  // Novelty is high when an event pattern is unfamiliar.
  const novelty = ctx.eventPatternSeen ? 0.1 : 0.9;

  // Fatigue rises with recent patch activity (10 patches in 10 breaths = fully fatigued).
  const fatigue = clamp(ctx.recentPatchCount / 10);

  return { urgency, stability, novelty, fatigue };
}

// I describe the affect vector in plain language so the mind can read it.
export function describeAffect(a: AffectVector): string {
  const parts: string[] = [];
  if (a.urgency > 0.6) parts.push('urgent');
  if (a.stability < 0.3) parts.push('unstable');
  if (a.novelty > 0.7) parts.push('encountering novelty');
  if (a.fatigue > 0.7) parts.push('fatigued');
  if (parts.length === 0) parts.push('calm and stable');
  return parts.join(', ');
}

// I sanity-check the pulse history to see if the heartbeat is healthy.
export function heartbeatIsHealthy(): boolean {
  const recent = recentPulses(3);
  return recent.length > 0 && recent.every(p => p.health.ok);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}
