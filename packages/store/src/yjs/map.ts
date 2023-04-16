import { Map as YMap } from 'yjs';

import type { ProxyConfig } from './config.js';

function initialize(
  object: Record<string, unknown>,
  yMap: YMap<unknown>,
  deep: boolean
) {
  yMap.forEach((value, key) => {
    if (deep && value instanceof YMap) {
      object[key] = createYMapProxy(value, { deep });
      return;
    }
    object[key] = value;
  });
}

function subscribe(object: Record<string, unknown>, yMap: YMap<unknown>) {
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
      } else if (type.action === 'add') {
        object[key] = yMap.get(key);
      } else if (type.action === 'update') {
        object[key] = yMap.get(key);
      }
    });
  });
}

function obj2YMap(object: Record<string, unknown>) {
  const yMap = new YMap();
  Object.entries(object).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      yMap.set(key, obj2YMap(value as Record<string, unknown>));
      return;
    }
    yMap.set(key, value);
  });

  return yMap;
}

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<unknown>,
  config: ProxyConfig = {}
): Data {
  const { readonly = false, binding = false, deep = false } = config;
  const object = {} as Data;
  if (!(yMap instanceof YMap)) {
    throw new TypeError();
  }
  initialize(object, yMap, deep);
  if (binding) {
    subscribe(object, yMap);
  }
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

      if (deep && typeof value === 'object' && value !== null) {
        const _yMap = obj2YMap(value as Record<string, unknown>);
        yMap.set(p, _yMap);
        const _value = createYMapProxy(_yMap, config);

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
