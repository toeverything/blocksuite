import type { Array as YArray } from 'yjs';

import type { ProxyConfig } from './config.js';
import { toPlainValue } from './utils.js';

export function subscribeYArray(
  arr: unknown[],
  yArray: YArray<unknown>,
  config: ProxyConfig
): void {
  const { deep = false } = config;
  yArray.observe(event => {
    if (event.changes.keys.size === 0) {
      // skip empty event
      return;
    }
    let retain = 0;
    event.changes.delta.forEach(change => {
      if (change.retain) {
        retain += change.retain;
      }
      if (change.delete) {
        arr.splice(retain, change.delete);
      }
      if (change.insert) {
        if (Array.isArray(change.insert)) {
          const value = deep ? change.insert.map(toPlainValue) : change.insert;
          arr.splice(retain, 0, ...value);
        } else {
          arr.splice(
            retain,
            0,
            deep ? toPlainValue(change.insert) : change.insert
          );
        }
        retain += change.insert.length;
      }
    });
  });
}
