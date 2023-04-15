import { Array as YArray } from 'yjs';

import type { ProxyConfig } from './proxy.js';

function initialize(arr: unknown[], yArray: YArray<unknown>) {
  yArray.forEach((value, key) => {
    arr[key] = value;
  });
}

export function createYArrayProxy<T = unknown>(
  yArray: YArray<T>,
  config: ProxyConfig = {}
): T[] {
  const { readonly = false } = config;
  const array: T[] = [];
  if (!(yArray instanceof YArray)) {
    throw new TypeError();
  }
  initialize(array, yArray as YArray<unknown>);
  return new Proxy(array, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      } else {
        if (typeof p === 'string') {
          const index = Number(p);
          if (!Number.isNaN(index)) {
            yArray.insert(index, [value]);
          }
          return Reflect.set(target, p, value, receiver);
        } else {
          throw new Error('key cannot be a symbol');
        }
      }
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty(target: T[], p: string | symbol): boolean {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      } else {
        if (typeof p === 'string') {
          const index = Number(p);
          if (!Number.isNaN(index)) {
            yArray.delete(index, 1);
          }
          return Reflect.deleteProperty(target, p);
        } else {
          throw new Error('key cannot be a symbol');
        }
      }
    },
  });
}
