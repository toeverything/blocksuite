import { assertExists } from '@blocksuite/global/utils';
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import { Boxed } from './boxed.js';
import type { UnRecord } from './utils.js';
import { native2Y, y2Native } from './utils.js';

type ProxyTransaction = Transaction & { isLocalProxy?: boolean };

export type ProxyOptions<T> = {
  onChange?: (data: T) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proxies = new WeakMap<any, unknown>();

export function createYProxy<Data>(
  yAbstract: unknown,
  options: ProxyOptions<Data> = {}
): Data {
  if (proxies.has(yAbstract)) {
    return proxies.get(yAbstract) as Data;
  }

  return y2Native(yAbstract, {
    transform: (value, origin) => {
      if (Boxed.is(origin)) {
        return value;
      }
      if (origin instanceof YArray) {
        subscribeYArray(
          value as unknown[],
          origin,
          options as ProxyOptions<unknown[]>
        );
        const proxy = getYArrayProxy(
          value as unknown[],
          origin,
          options as ProxyOptions<unknown[]>
        );
        proxies.set(origin, proxy);
        return proxy;
      }
      if (origin instanceof YMap) {
        subscribeYMap(
          value as UnRecord,
          origin,
          options as ProxyOptions<UnRecord>
        );
        const proxy = getYMapProxy(
          value as UnRecord,
          origin,
          options as ProxyOptions<UnRecord>
        );
        proxies.set(origin, proxy);
        return proxy;
      }

      return value;
    },
  }) as Data;
}

function transformNative(
  value: unknown,
  onCreate: (p: unknown) => void,
  options: ProxyOptions<never> = {}
) {
  const y = native2Y(value);
  onCreate(y);
  return createYProxy(y, options);
}

function subscribeYArray(
  arr: unknown[],
  yArray: YArray<unknown>,
  options: ProxyOptions<unknown[]>
) {
  const observer = (
    event: YArrayEvent<unknown> & { transaction: ProxyTransaction }
  ) => {
    if (event.transaction.isLocalProxy) {
      options.onChange?.(arr);
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
        const _arr = [change.insert].flat();

        const proxyList = _arr
          .filter(value => {
            return !proxies.has(value);
          })
          .map(value => {
            return createYProxy(value);
          });
        arr.splice(retain, 0, ...proxyList);

        retain += change.insert.length;
      }
    });
    options.onChange?.(arr);
  };

  yArray.observe(observer);
}

function subscribeYMap(
  object: UnRecord,
  yMap: YMap<unknown>,
  options: ProxyOptions<UnRecord>
) {
  const observer = (
    event: YMapEvent<unknown> & { transaction: ProxyTransaction }
  ) => {
    if (event.transaction.isLocalProxy) {
      options.onChange?.(object);
      return;
    }
    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      if (!type) {
        return;
      }
      if (type.action === 'delete') {
        delete object[key];
      } else if (type.action === 'add' || type.action === 'update') {
        const current = yMap.get(key);
        if (proxies.has(current)) {
          object[key] = proxies.get(current);
        } else {
          object[key] = createYProxy(current);
        }
      }
    });
    options.onChange?.(object);
  };
  yMap.observe(observer);
}

function applyYChanges<T = unknown>(
  yData: YArray<unknown> | YMap<unknown>,
  changes: () => T
): T {
  const data = proxies.get(yData);
  assertExists(data, 'YData is not subscribed before changes');
  const doc = yData.doc;
  assertExists(doc, 'YData is not attached to a document');
  doc.once('beforeObserverCalls', (transaction: ProxyTransaction) => {
    transaction.isLocalProxy = true;
  });
  return changes();
}

function getYArrayProxy<T = unknown>(
  array: T[],
  yArray: YArray<unknown>,
  options: ProxyOptions<unknown[]>
) {
  return new Proxy(array, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      return applyYChanges(yArray, () => {
        const index = Number(p);
        if (Number.isNaN(index)) {
          return Reflect.set(target, p, value, receiver);
        }

        const data = transformNative(
          value,
          x => {
            if (index < yArray.length) {
              yArray.delete(index, 1);
            }
            yArray.insert(index, [x]);
          },
          options
        );
        return Reflect.set(target, p, data, receiver);
      });
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty: (target: T[], p: string | symbol): boolean => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      return applyYChanges(yArray, () => {
        const index = Number(p);
        if (!Number.isNaN(index)) {
          yArray.delete(index, 1);
        }
        return Reflect.deleteProperty(target, p);
      });
    },
  });
}

function getYMapProxy<Data extends Record<string, unknown>>(
  object: Data,
  yMap: YMap<unknown>,
  options: ProxyOptions<UnRecord>
) {
  return new Proxy(object, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      return applyYChanges(yMap, () => {
        const data = transformNative(value, x => yMap.set(p, x), options);
        return Reflect.set(target, p, data, receiver);
      });
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty: (target: Data, p: string | symbol): boolean => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      return applyYChanges(yMap, () => {
        yMap.delete(p);
        return Reflect.deleteProperty(target, p);
      });
    },
  });
}
