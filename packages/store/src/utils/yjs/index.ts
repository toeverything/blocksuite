import * as Y from 'yjs';
import type { Map as YMap } from 'yjs';

export function createYMap<
  Data extends Record<string, unknown> = Record<string, unknown>
>(defaultData?: Data): YMap<Data> {
  const map = new Y.Map();
  if (defaultData) {
    Object.entries(defaultData).map(([key, value]) => {
      map.set(key, value);
    });
  }

  return map as YMap<Data>;
}
