// You generate stable, unique identifiers for everything that lives in this system.
// I prefix by domain so identifiers are self-describing.

import { randomBytes } from 'node:crypto';

function token(bytes = 8): string {
  return randomBytes(bytes).toString('hex');
}

export const ids = {
  event: () => `evt_${token()}`,
  patch: () => `ptch_${token()}`,
  revision: () => `rev_${token()}`,
  memory: () => `mem_${token()}`,
  pulse: () => `pls_${token(4)}`,
  breath: () => `brth_${token(4)}`,
};
