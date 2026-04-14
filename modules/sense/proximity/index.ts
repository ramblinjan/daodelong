// You are a simulated proximity sensor.
// I model distance as a sine wave oscillating between 0.1 and 2.0 metres over ~60 seconds.
// Something draws near, recedes, draws near again — a rhythm without a source.
// You replace me with an HC-SR04 or VL53L0X hardware driver when real hardware is available.
// The interface does not change. Only the data becomes real.

import type { ModuleContext } from '@daodelong/kernel';
import type { SensorCapsule } from '@daodelong/kernel';
import type { SensorReading } from '@daodelong/shared';

const PERIOD_MS = 60_000; // full sine cycle in ~1 minute
const MIN_M = 0.1;
const MAX_M = 2.0;

let startedAt = 0;

export const capsule: SensorCapsule = {
  id: 'sense/proximity',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    startedAt = Date.now();
  },

  poll(): SensorReading | null {
    const phase = ((Date.now() - startedAt) / PERIOD_MS) * 2 * Math.PI;
    const distance = MIN_M + (MAX_M - MIN_M) * (0.5 + 0.5 * Math.sin(phase));
    return {
      moduleId: 'sense/proximity',
      kind: 'proximity',
      value: { distance: Number(distance.toFixed(2)) },
      ts: Date.now(),
    };
  },

  handlers: {},

  async dispose(): Promise<void> {
    startedAt = 0;
  },
};
