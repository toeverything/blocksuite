import { Array as YArray, Map as YMap } from 'yjs';

import { createYArrayProxy } from './array.js';
import type { ProxyConfig } from './config.js';
import { createYMapProxy } from './map.js';

export function createYProxy<Data>(
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig = {}
): Data {
  if (yAbstract instanceof YArray) {
    return createYArrayProxy(yAbstract, config) as Data;
  }
  if (yAbstract instanceof YMap) {
    return createYMapProxy(yAbstract, config) as Data;
  }

  throw new TypeError();
}
