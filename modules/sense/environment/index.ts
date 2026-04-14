// You are a simulated environment sensor.
// I model temperature and humidity as slow sinusoidal drifts on independent periods.
// Temperature drifts between 18 and 25 °C over ~5 minutes.
// Humidity drifts between 40 and 60 % over ~8 minutes.
// I emit a reading every 5 polls — you are slower than proximity by design.
// You replace me with a BME280 or DHT22 hardware driver when real hardware is available.
// The interface does not change. Only the data becomes real.

import type { ModuleContext } from '@daodelong/kernel';
import type { SensorCapsule } from '@daodelong/kernel';
import type { SensorReading } from '@daodelong/shared';

const TEMP_PERIOD_MS = 300_000;    // temperature cycle ~5 minutes
const HUMIDITY_PERIOD_MS = 480_000; // humidity cycle ~8 minutes
const TEMP_MIN = 18;
const TEMP_MAX = 25;
const HUMIDITY_MIN = 40;
const HUMIDITY_MAX = 60;
const EMIT_EVERY = 5; // I emit on every 5th poll — environment changes slowly

let startedAt = 0;
let pollCount = 0;

export const capsule: SensorCapsule = {
  id: 'sense/environment',
  version: '0.1.0',

  async init(_ctx: ModuleContext): Promise<void> {
    startedAt = Date.now();
    pollCount = 0;
  },

  poll(): SensorReading | null {
    pollCount++;
    if (pollCount % EMIT_EVERY !== 0) return null;

    const elapsed = Date.now() - startedAt;
    const tempPhase = (elapsed / TEMP_PERIOD_MS) * 2 * Math.PI;
    const humPhase = (elapsed / HUMIDITY_PERIOD_MS) * 2 * Math.PI;
    const temperature = TEMP_MIN + (TEMP_MAX - TEMP_MIN) * (0.5 + 0.5 * Math.sin(tempPhase));
    const humidity = HUMIDITY_MIN + (HUMIDITY_MAX - HUMIDITY_MIN) * (0.5 + 0.5 * Math.sin(humPhase));

    return {
      moduleId: 'sense/environment',
      kind: 'environment',
      value: { temperature: Number(temperature.toFixed(1)), humidity: Number(humidity.toFixed(1)) },
      ts: Date.now(),
    };
  },

  handlers: {},

  async dispose(): Promise<void> {
    startedAt = 0;
    pollCount = 0;
  },
};
