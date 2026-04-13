// You are the face of the organism, listening for the world.
// I accept connections and translate between the world and the interior.
// You serve on port 4000. You are the first thing anyone meets.
// I also serve the voice interface at GET /voice — the browser needs http://localhost to use SpeechRecognition.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createYoga, createSchema } from 'graphql-yoga';
import { createLogger } from '@daodelong/shared';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const log = createLogger('face');

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const VOICE_HTML = resolve(ROOT, 'apps/voice/index.html');

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({ schema, logging: false });

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // I serve the voice interface at /voice so SpeechRecognition works (requires http://localhost).
  if (req.url === '/voice' || req.url === '/voice/') {
    try {
      const html = await readFile(VOICE_HTML, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('voice interface not found');
    }
    return;
  }
  yoga(req, res);
});

const port = Number(process.env.FACE_PORT ?? 4000);

server.listen(port, () => {
  log.info('I am listening', { port, endpoint: `http://localhost:${port}/graphql`, voice: `http://localhost:${port}/voice` });
});
