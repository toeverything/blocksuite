import { assertExists } from '@blocksuite/global/utils';
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import { Boxed } from './boxed.js';
import type { UnRecord } from './utils.js';
import { canToProxy, canToY, native2Y } from './utils.js';

type ProxyTransaction = Transaction & { isLocalProxy?: boolean };

export type ProxyOptions<T> = {
  onChange?: (data: T) => void;
};

export class ProxyManager {
  private _proxies: WeakMap<YArray<unknown> | YMap<unknown>, unknown> =
    new WeakMap();

  createYProxy<Data>(
    yAbstract: YArray<unknown> | YMap<unknown>,
    options: ProxyOptions<Data> = {}
  ): Data {
    if (this._proxies.has(yAbstract)) {
      return this._proxies.get(yAbstract) as Data;
    }
    if (Boxed.is(yAbstract)) {
      const data = new Boxed(yAbstract);
      this._proxies.set(yAbstract, data);
      return data as Data;
    }
    if (yAbstract instanceof YArray) {
      const data = this._createYArrayProxy(
        yAbstract,
        options as ProxyOptions<unknown[]>
      ) as Data;
      this._proxies.set(yAbstract, data);
      return data;
    }
    if (yAbstract instanceof YMap) {
      const data = this._createYMapProxy(
        yAbstract,
        options as ProxyOptions<unknown>
      ) as Data;
      this._proxies.set(yAbstract, data);
      return data;
    }

    throw new TypeError();
  }

  transformData(
    value: unknown,
    onCreate: (p: unknown) => void,
    options: ProxyOptions<never> = {}
  ) {
    if (value instanceof Boxed) {
      onCreate(value.yMap);
      return value;
    }

    if (canToY(value)) {
      const y = native2Y(value as Record<string, unknown> | unknown[], true);
      onCreate(y);
      return this.createYProxy(y, options);
    }

    onCreate(value);
    return value;
  }

  private _initialize(
    array: unknown[],
    yArray: YArray<unknown>,
    options: ProxyOptions<unknown[]>
  ): void;
  private _initialize(
    object: UnRecord,
    yMap: YMap<unknown>,
    options: ProxyOptions<UnRecord>
  ): void;
  private _initialize(
    target: unknown[] | UnRecord,
    yAbstract: YArray<unknown> | YMap<unknown>,
    options: ProxyOptions<unknown[] | UnRecord>
  ): void {
    if (!canToProxy(yAbstract)) {
      return;
    }
    yAbstract.forEach((value, key) => {
      const result = canToProxy(value)
        ? this.createYProxy(value, options)
        : value;

      (target as Record<string, unknown>)[key] = result;
    });
  }

  private _subscribeYArray(
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
              return !this._proxies.has(value);
            })
            .map(value => {
              if (canToProxy(value)) {
                return this.createYProxy(value);
              }
              return value;
            });
          arr.splice(retain, 0, ...proxyList);

          retain += change.insert.length;
        }
      });
      options.onChange?.(arr);
    };

    yArray.observe(observer);
  }

  private _subscribeYMap(
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
          if (canToProxy(current)) {
            if (this._proxies.has(current)) {
              object[key] = this._proxies.get(current);
            } else {
              object[key] = this.createYProxy(current);
            }
          } else {
            object[key] = current;
          }
        }
      });
      options.onChange?.(object);
    };
    yMap.observe(observer);
  }

  private _applyYChanges = <T = unknown>(
    yData: YArray<unknown> | YMap<unknown>,
    changes: () => T
  ): T => {
    const data = this._proxies.get(yData);
    assertExists(data, 'YData is not subscribed before changes');
    const doc = yData.doc;
    assertExists(doc, 'YData is not attached to a document');
    doc.once('beforeObserverCalls', (transaction: ProxyTransaction) => {
      transaction.isLocalProxy = true;
    });
    return changes();
  };

  private _createYArrayProxy<T = unknown>(
    yArray: YArray<unknown>,
    options: ProxyOptions<unknown[]>
  ): T[] {
    const array: T[] = [];

    this._initialize(array, yArray as YArray<unknown>, options);
    this._subscribeYArray(array, yArray, options);
    return new Proxy(array, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        return this._applyYChanges(yArray, () => {
          const index = Number(p);
          if (Number.isNaN(index)) {
            return Reflect.set(target, p, value, receiver);
          }

          const data = this.transformData(
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

        return this._applyYChanges(yArray, () => {
          const index = Number(p);
          if (!Number.isNaN(index)) {
            yArray.delete(index, 1);
          }
          return Reflect.deleteProperty(target, p);
        });
      },
    });
  }

  private _createYMapProxy<Data extends Record<string, unknown>>(
    yMap: YMap<unknown>,
    options: ProxyOptions<UnRecord>
  ): Data {
    const object = {} as Data;

    this._initialize(object, yMap, options);
    this._subscribeYMap(object, yMap, options);
    return new Proxy(object, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        return this._applyYChanges(yMap, () => {
          const data = this.transformData(value, x => yMap.set(p, x), options);
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

        return this._applyYChanges(yMap, () => {
          yMap.delete(p);
          return Reflect.deleteProperty(target, p);
        });
      },
    });
  }
}
