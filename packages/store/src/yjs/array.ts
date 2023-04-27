import { Array as YArray } from 'yjs';

import type { ProxyConfig } from './config.js';
import { createYProxy } from './proxy.js';
import { initialize, isPureObject, native2Y, toPlainValue } from './utils.js';

export function createYArrayProxy<T = unknown>(
  yArray: YArray<unknown>,
  config: ProxyConfig = {}
): T[] {
  const { readonly = false, deep = false } = config;
  const array: T[] = [];
  if (!(yArray instanceof YArray)) {
    throw new TypeError();
  }
  initialize(array, yArray as YArray<unknown>, config);
  subscribeYArray(array, yArray, config);
  return new Proxy(array, {
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

      const index = Number(p);
      if (Number.isNaN(index)) {
        return Reflect.set(target, p, value, receiver);
      }

      const apply = (value: unknown) => {
        if (index < yArray.length) {
          yArray.delete(index, 1);
        }
        yArray.insert(index, [value]);
      };

      if (deep && (isPureObject(value) || Array.isArray(value))) {
        const y = native2Y(value as Record<string, unknown> | unknown[], deep);
        apply(y);
        const _value = createYProxy(y, config);
        return Reflect.set(target, p, _value, receiver);
      }

      apply(value);
      return Reflect.set(target, p, value, receiver);
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty(target: T[], p: string | symbol): boolean {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      }

      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      const index = Number(p);
      if (!Number.isNaN(index)) {
        yArray.delete(index, 1);
      }
      return Reflect.deleteProperty(target, p);
    },
  });
}

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
