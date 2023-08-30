import { assertExists } from '@blocksuite/global/utils';
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import type { ProxyConfig } from './config.js';
import { NativeWrapper } from './native-wrapper.js';
import type { UnRecord } from './utils.js';
import { isPureObject, native2Y } from './utils.js';

type ProxyTransaction = Transaction & { isLocalProxy?: boolean };

export class ProxyManager {
  private _proxies: WeakMap<YArray<unknown> | YMap<unknown>, unknown> =
    new WeakMap();

  private _initialize(
    array: unknown[],
    yArray: YArray<unknown>,
    config: ProxyConfig
  ): void;
  private _initialize(
    object: UnRecord,
    yMap: YMap<unknown>,
    config: ProxyConfig
  ): void;
  private _initialize(
    target: unknown[] | UnRecord,
    yAbstract: YArray<unknown> | YMap<unknown>,
    config: ProxyConfig
  ): void;
  private _initialize(
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
          ? this.createYProxy(value, config)
          : value;

      (target as Record<string, unknown>)[key] = result;
    });
  }

  private _subscribeYArray(
    arr: unknown[],
    yArray: YArray<unknown>,
    config: ProxyConfig
  ) {
    const { deep = false } = config;
    const observer = (
      event: YArrayEvent<unknown> & { transaction: ProxyTransaction }
    ) => {
      if (event.transaction.isLocalProxy) {
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
          if (deep) {
            const proxyList = _arr
              .filter(value => {
                return !this._proxies.has(value);
              })
              .map(value => {
                if (value instanceof YMap || value instanceof YArray) {
                  return this.createYProxy(value, config);
                }
                return value;
              });
            arr.splice(retain, 0, ...proxyList);
          } else {
            arr.splice(retain, 0, ..._arr);
          }

          retain += change.insert.length;
        }
      });
    };

    yArray.observe(observer);
  }

  private _subscribeYMap(
    object: UnRecord,
    yMap: YMap<unknown>,
    config: ProxyConfig
  ) {
    const { deep = false } = config;
    const observer = (
      event: YMapEvent<unknown> & { transaction: ProxyTransaction }
    ) => {
      if (event.transaction.isLocalProxy) {
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
          if (deep && (current instanceof YMap || current instanceof YArray)) {
            if (this._proxies.has(current)) {
              object[key] = this._proxies.get(current);
            } else {
              object[key] = this.createYProxy(current, config);
            }
          } else {
            object[key] = current;
          }
        }
      });
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

  createYProxy<Data>(
    yAbstract: YArray<unknown> | YMap<unknown>,
    config: ProxyConfig = {}
  ): Data {
    if (this._proxies.has(yAbstract)) {
      return this._proxies.get(yAbstract) as Data;
    }
    if (yAbstract instanceof NativeWrapper) {
      const data = this._createYMapProxy(yAbstract, {
        ...config,
        deep: false,
      }) as Data;
      this._proxies.set(yAbstract, data);
      return data;
    }
    if (yAbstract instanceof YArray) {
      const data = this._createYArrayProxy(yAbstract, config) as Data;
      this._proxies.set(yAbstract, data);
      return data;
    }
    if (yAbstract instanceof YMap) {
      const data = this._createYMapProxy(yAbstract, config) as Data;
      this._proxies.set(yAbstract, data);
      return data;
    }

    throw new TypeError();
  }

  private _createYArrayProxy<T = unknown>(
    yArray: YArray<unknown>,
    config: ProxyConfig = {}
  ): T[] {
    const { readonly = false, deep = false } = config;
    const array: T[] = [];
    if (!(yArray instanceof YArray)) {
      throw new TypeError();
    }
    this._initialize(array, yArray as YArray<unknown>, config);
    this._subscribeYArray(array, yArray, config);
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

        return this._applyYChanges(yArray, () => {
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
            const y = native2Y(
              value as Record<string, unknown> | unknown[],
              deep
            );
            apply(y);
            const _value = this.createYProxy(y, config);
            return Reflect.set(target, p, _value, receiver);
          }

          apply(value);
          return Reflect.set(target, p, value, receiver);
        });
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target: T[], p: string | symbol): boolean => {
        if (readonly) {
          throw new Error('Modify data is not allowed');
        }

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
    config: ProxyConfig = {}
  ): Data {
    const { readonly = false, deep = false } = config;
    const object = {} as Data;
    if (!(yMap instanceof YMap)) {
      throw new TypeError();
    }
    this._initialize(object, yMap, config);
    this._subscribeYMap(object, yMap, config);
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

        return this._applyYChanges(yMap, () => {
          if (deep && (isPureObject(value) || Array.isArray(value))) {
            const _y = native2Y(
              value as Record<string, unknown> | unknown[],
              deep
            );
            yMap.set(p, _y);
            const _value = this.createYProxy(_y, config);

            return Reflect.set(target, p, _value, receiver);
          }

          yMap.set(p, value);
          return Reflect.set(target, p, value, receiver);
        });
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target: Data, p: string | symbol): boolean => {
        if (readonly) {
          throw new Error('Modify data is not allowed');
        }

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
