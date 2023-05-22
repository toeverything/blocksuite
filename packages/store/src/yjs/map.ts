import type { Map as YMap } from 'yjs';

import type { ProxyConfig } from './config.js';
import type { UnRecord } from './utils.js';
import { toPlainValue } from './utils.js';

export function subscribeYMap(
  object: UnRecord,
  yMap: YMap<unknown>,
  config: ProxyConfig
): void {
  const { deep = false } = config;
  yMap.observe(event => {
    if (event.changes.keys.size === 0) {
      // skip empty event
      return;
    }
    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      if (!type) {
        console.error('impossible event', event);
        return;
      }
      if (type.action === 'delete') {
        delete object[key];
      } else if (type.action === 'add' || type.action === 'update') {
        object[key] = deep ? toPlainValue(yMap.get(key)) : yMap.get(key);
      }
    });
  });
}
