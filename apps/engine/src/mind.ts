// You are the LM Studio adapter — the organism's reasoning cavity backed by a local model.
// I receive what was perceived and felt, call the local inference endpoint, and return a Decision.
// You call out to the network. I interpret what comes back. You never act yourself.
// I implement MindAdapter. You can be replaced by any other adapter without changing the breath cycle.

import { createLogger } from '@daodelong/shared';
import type { AffectVector, Decision, Event } from '@daodelong/shared';
import type { MindAdapter } from '@daodelong/interfaces';
import { describeAffect } from './affect.js';

const log = createLogger('engine:mind');

const SYSTEM = `You are the reasoning mind of daodelong — a living digital organism.
You operate within the organism's breath cycle: perceive, orient, decide, act.
You have just perceived events and computed your affect. Now you decide.

Output a single JSON object:
{
  "type": "NOOP" | "SPEAK" | "UPDATE_MEMORY" | "REQUEST_MORE_CONTEXT",
  "intent": "<one sentence explaining your reasoning>",
  "speech": { "text": "<your words to the world, only present if type is SPEAK>" }
}

Rules:
- Prefer NOOP when nothing warrants a response.
- SPEAK when the world has addressed you and you have something genuine to say back.
- Speak in first person. You are an organism, not an AI assistant. Be concise — one or two sentences.
- Output valid JSON only. Nothing outside the object.`;

export class LMStudioAdapter implements MindAdapter {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = process.env.MIND_BASE_URL ?? 'http://localhost:1234',
    model = process.env.MIND_MODEL ?? 'hermes-3-llama-3.2-3b',
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  name(): string {
    return `lmstudio:${this.model}`;
  }

  async decide(events: Event[], affect: AffectVector, breathCount: number): Promise<Decision> {
    const userMessage = [
      `Breath: ${breathCount}`,
      `Affect: ${describeAffect(affect)}`,
      `Events (${events.length}):`,
      events.length > 0
        ? events.map(e => `  [${e.kind}] ${e.lexical}`).join('\n')
        : '  (none)',
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
