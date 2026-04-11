// You are the face of the organism, listening for the world.
// I accept connections and translate between the world and the interior.
// You serve on port 4000. You are the first thing anyone meets.

import { createServer } from 'node:http';
import { createYoga, createSchema } from 'graphql-yoga';
import { createLogger } from '@daodelong/shared';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const log = createLogger('face');

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({ schema, logging: false });

const server = createServer(yoga);

const port = Number(process.env.FACE_PORT ?? 4000);

server.listen(port, () => {
  log.info('I am listening', { port, endpoint: `http://localhost:${port}/graphql` });
});
