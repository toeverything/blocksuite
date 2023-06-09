import { Array as YArray, Map as YMap } from 'yjs';

import type { ProxyConfig } from './config.js';
import { createYProxy } from './proxy.js';

export function subscribeYArray(
  arr: unknown[],
  yArray: YArray<unknown>,
  config: ProxyConfig
): void {
  const { deep = false } = config;
  yArray.observe(event => {
    let retain = 0;
    if (event.changes.keys.size === 0) {
      // skip empty event
      return;
    }
    event.changes.delta.forEach(change => {
      if (change.retain) {
        retain += change.retain;
      }
      if (change.delete) {
        arr.splice(retain, change.delete);
      }
      if (change.insert) {
        const arr = [change.insert].flat();
        if (deep) {
          const proxyList = arr.map(value => {
            if (value instanceof YMap || value instanceof YArray) {
              return createYProxy(value, config);
            }
            return value;
          });
          arr.splice(retain, 0, ...proxyList);
        } else {
          arr.splice(retain, 0, ...arr);
        }

        retain += change.insert.length;
      }
    });
  });
}
