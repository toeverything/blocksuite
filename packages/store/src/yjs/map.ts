import { Map as YMap } from 'yjs';

import type { ProxyConfig } from './config.js';
import { createYProxy } from './proxy.js';
import type { UnRecord } from './utils.js';
import { initialize, isPureObject, native2Y, toPlainValue } from './utils.js';

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<unknown>,
  config: ProxyConfig = {}
): Data {
  const { readonly = false, deep = false } = config;
  const object = {} as Data;
  if (!(yMap instanceof YMap)) {
    throw new TypeError();
  }
  initialize(object, yMap, config);
  subscribeYMap(object, yMap, config);
  return new Proxy(object, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      }

      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      if (deep && (isPureObject(value) || Array.isArray(value))) {
        const _y = native2Y(value as Record<string, unknown> | unknown[], deep);
        yMap.set(p, _y);
        const _value = createYProxy(_y, config);

        return Reflect.set(target, p, _value, receiver);
      }

      yMap.set(p, value);
      return Reflect.set(target, p, value, receiver);
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty(target: Data, p: string | symbol): boolean {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      }

      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      yMap.delete(p);
      return Reflect.deleteProperty(target, p);
    },
  });
}

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
