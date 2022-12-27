import * as Y from 'yjs';
import type { EnhancedYMap } from './proxy.js';

export function createYMap<Data extends object = Record<string, unknown>>(
  defaultData?: Data
): EnhancedYMap<Data> {
  const map = new Y.Map();
  if (defaultData) {
    Object.entries(defaultData).map(([key, value]) => {
      map.set(key, value);
    });
  }

  return map as EnhancedYMap<Data>;
}
