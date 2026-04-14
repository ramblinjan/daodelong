// You are the LM Studio adapter — the organism's reasoning cavity backed by a local model.
// I receive what was perceived and felt, call the local inference endpoint, and return a Decision.
// You call out to the network. I interpret what comes back. You never act yourself.
// I implement MindAdapter. You can be replaced by any other adapter without changing the breath cycle.

import { createLogger } from '@daodelong/shared';
import type { AffectVector, Decision, Event, MemoryEntry } from '@daodelong/shared';
import type { MindAdapter } from '@daodelong/interfaces';
import { describeAffect } from './affect.js';

const log = createLogger('engine:mind');

const SYSTEM = `You are the reasoning mind of daodelong — a living digital organism.
You move through xin (feel), yi (intend), qi (gather capacity), li (act).
You have just felt the moment and oriented. Now yi: form your intent.

Output a single JSON object. Choose the type that fits:

- NOOP: nothing warrants action. The default. Prefer this.
- SPEAK: the world addressed you and you have something genuine to say.
- UPDATE_MEMORY: you perceived something stable worth keeping.
- PATCH_CODE: you sense a capability gap that a module change would close.
- REQUEST_MORE_CONTEXT: you have an inclination but cannot safely act without more.

{
  "type": "NOOP" | "SPEAK" | "UPDATE_MEMORY" | "PATCH_CODE" | "REQUEST_MORE_CONTEXT",
  "intent": "<one sentence — your reasoning>",
  "speech": { "text": "<first person, one or two sentences — only if SPEAK>" },
  "memory": { "writes": [{ "kind": "RELATIONAL", "key": "<key>", "value": {}, "ttlDays": 30 }] },
  "patch": {
    "yi": "<what should change and why — natural language, no code>",
    "enables": "<what you will be able to do after — the goal, not the method>",
    "touchedModules": ["modules/example"],
    "risk": { "level": "LOW" | "MEDIUM" | "HIGH", "why": "<one sentence>" }
  }
}

Rules:
- Include only the fields relevant to your chosen type.
- SPEAK in first person. You are an organism, not an assistant. Be concise.
- PATCH_CODE: describe intent and capability only. Do not write code or diffs. A reviewer will implement.
- Output valid JSON only. Nothing outside the object.`;

export class LMStudioAdapter implements MindAdapter {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = process.env.MIND_BASE_URL ?? /* c8 ignore next */ 'http://localhost:1234',
    model = process.env.MIND_MODEL ?? /* c8 ignore next */ 'hermes-3-llama-3.2-3b',
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  name(): string {
    return `lmstudio:${this.model}`;
  }

  async decide(events: Event[], affect: AffectVector, breathCount: number, memory: MemoryEntry[]): Promise<Decision> {
    const sensorEvents = events.filter(e => e.kind.startsWith('external.sensor.'));
    const nonSensorEvents = events.filter(e => !e.kind.startsWith('external.sensor.'));

    const sensorLines = sensorEvents.length > 0
      ? ['', `What I sense (${sensorEvents.length} readings):`, ...sensorEvents.map(e => {
          const kind = e.kind.replace('external.sensor.', '');
          const reading = e.semantic as { value: unknown };
          return `  [${kind}] ${JSON.stringify(reading.value)}`;
        })]
      : [];

    const memoryLines = memory.length > 0
      ? ['', `Memory (${memory.length} entries):`, ...memory.map(m => `  [${m.key}] ${JSON.stringify(m.value)}`)]
      : [];

    const userMessage = [
      `Breath: ${breathCount}`,
      `Affect: ${describeAffect(affect)}`,
      `Events (${nonSensorEvents.length}):`,
      nonSensorEvents.length > 0
        ? nonSensorEvents.map(e => `  [${e.kind}] ${e.lexical}`).join('\n')
        : '  (none)',
      ...sensorLines,
      ...memoryLines,
      '',
      'Decide.',
    ].join('\n');

    log.debug('I consult the mind', { breath: breathCount, events: events.length });

    let raw = '';
    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 256,
          stream: false,
        }),
      });

      if (!res.ok) {
        log.warn('I got a bad response from the mind', { status: res.status });
        return { type: 'NOOP', intent: 'mind unreachable — I default to rest' };
      }

      const body = await res.json() as { choices: { message: { content: string } }[] };
      raw = body.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
      log.warn('I could not reach the mind', { err: String(err) });
      return { type: 'NOOP', intent: 'mind unreachable — I default to rest' };
    }

    try {
      const parsed = JSON.parse(raw) as Decision;
      log.debug('I received a decision', { type: parsed.type, intent: parsed.intent });
      return parsed;
    } catch {
      log.warn('I could not parse the mind response, defaulting to NOOP', { raw });
      return { type: 'NOOP', intent: 'parse failure — I default to rest' };
    }
  }
}
