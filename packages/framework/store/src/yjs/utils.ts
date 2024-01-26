import type { Doc as YDoc } from 'yjs';

export type SubdocEvent = {
  loaded: Set<YDoc>;
  removed: Set<YDoc>;
  added: Set<YDoc>;
};
