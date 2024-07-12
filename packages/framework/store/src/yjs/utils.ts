import type { Doc as YDoc } from 'yjs';

export type SubdocEvent = {
  added: Set<YDoc>;
  loaded: Set<YDoc>;
  removed: Set<YDoc>;
};
