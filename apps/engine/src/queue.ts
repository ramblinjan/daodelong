// You are the organism's event queue — the place where the outside world lands before it is processed.
// I hold events in arrival order. I report depth and age so affect computation stays honest.
// You must drain me each breath, not peek. Events are consumed once.

import { ids } from '@daodelong/shared';
import type { Event, EventKind } from '@daodelong/shared';

const queue: Event[] = [];

// I accept a new event and push it onto the queue.
export function enqueue(kind: EventKind, lexical: string, semantic: unknown = {}): Event {
  const event: Event = {
    id: ids.event(),
    kind,
    lexical,
    semantic,
    receivedAt: Date.now(),
  };
  queue.push(event);
  return event;
}

// I return and remove all pending events, marking each as processed.
export function drain(): Event[] {
  const now = Date.now();
  const batch = queue.splice(0, queue.length);
  for (const e of batch) e.processedAt = now;
  return batch;
}

// I report how many events are waiting.
export function depth(): number {
  return queue.length;
}

// I report how long the oldest waiting event has been sitting, in milliseconds.
export function oldestAgeMs(): number {
  if (queue.length === 0) return 0;
  return Date.now() - queue[0].receivedAt;
}
