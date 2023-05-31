import { Array as YArray, Map as YMap } from 'yjs';

import { subscribeYArray } from './array.js';
import type { ProxyConfig } from './config.js';
import { subscribeYMap } from './map.js';
import type { UnRecord } from './utils.js';
import { isPureObject, native2Y } from './utils.js';

export function initialize(
  array: unknown[],
  yArray: YArray<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  object: UnRecord,
  yMap: YMap<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void {
  const { deep } = config;
  if (!(yAbstract instanceof YArray || yAbstract instanceof YMap)) {
    return;
  }
  yAbstract.forEach((value, key) => {
    const result =
      deep && (value instanceof YMap || value instanceof YArray)
        ? createYProxy(value, config)
        : value;

    (target as Record<string, unknown>)[key] = result;
  });
}

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
