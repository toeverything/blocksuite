import { assertExists } from '@blocksuite/global/utils';
import type { YArrayEvent, YMapEvent } from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import { Boxed } from './boxed.js';
import type { UnRecord } from './utils.js';
import { native2Y, y2Native } from './utils.js';

export type ProxyOptions<T> = {
  onChange?: (data: T) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proxies = new WeakMap<any, unknown>();

export class ReactiveYArray {
  private readonly _proxy: unknown[];
  private _skipNext = false;
  constructor(
    readonly array: unknown[],
    readonly yArray: YArray<unknown>,
    readonly options: ProxyOptions<unknown[]>
  ) {
    this.array = array;
    this.yArray = yArray;
    this.options = options;
    this._proxy = this._getProxy();
    yArray.observe(this._observer);
  }

  get proxy() {
    return this._proxy;
  }

  private _getProxy = () => {
    return new Proxy(this.array, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        const proxied = proxies.get(this.yArray);
        const doc = this.yArray.doc;
        assertExists(proxied, 'YData is not subscribed before changes');
        assertExists(doc, 'YData is not bound to a Y.Doc');

        const index = Number(p);
        if (this._skipNext || Number.isNaN(index)) {
          return Reflect.set(target, p, value, receiver);
        }

        const yData = native2Y(value);

        doc.transact(() => {
          if (index < this.yArray.length) {
            this.yArray.delete(index, 1);
          }
          this.yArray.insert(index, [yData]);
        });

        const data = createYProxy(yData, this.options);
        return Reflect.set(target, p, data, receiver);
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target, p): boolean => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        const proxied = proxies.get(this.yArray);
        assertExists(proxied, 'YData is not subscribed before changes');

        const index = Number(p);
        if (this._skipNext || Number.isNaN(index)) {
          return Reflect.deleteProperty(target, p);
        }

        this.yArray.delete(index, 1);
        return Reflect.deleteProperty(target, p);
      },
    });
  };

  private _observer = (event: YArrayEvent<unknown>) => {
    let retain = 0;
    if (!event.transaction.local) {
      event.changes.delta.forEach(change => {
        if (change.retain) {
          retain += change.retain;
          return;
        }
        if (change.delete) {
          this._skipNext = true;
          this.array.splice(retain, change.delete);
          this._skipNext = false;
          return;
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

          this._skipNext = true;
          this.array.splice(retain, 0, ...proxyList);
          this._skipNext = false;

          retain += change.insert.length;
        }
      });
    }
    this.options.onChange?.(this._proxy);
  };
}

export class ReactiveYMap {
  private readonly _proxy: UnRecord;
  private _skipNext = false;
  constructor(
    readonly map: UnRecord,
    readonly yMap: YMap<unknown>,
    readonly options: ProxyOptions<UnRecord>
  ) {
    this.map = map;
    this.yMap = yMap;
    this.options = options;
    this._proxy = this._getProxy();
    yMap.observe(this._observer);
  }

  get proxy() {
    return this._proxy;
  }

  private _getProxy = () => {
    return new Proxy(this.map, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }
        if (this._skipNext) {
          return Reflect.set(target, p, value, receiver);
        }

        const proxied = proxies.get(this.yMap);
        const doc = this.yMap.doc;
        assertExists(proxied, 'YData is not subscribed before changes');
        assertExists(doc, 'YData is not bound to a Y.Doc');

        const yData = native2Y(value);
        this.yMap.set(p, yData);
        const data = createYProxy(yData, this.options);
        return Reflect.set(target, p, data, receiver);
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target, p) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }
        if (this._skipNext) {
          return Reflect.deleteProperty(target, p);
        }

        const proxied = proxies.get(this.yMap);
        assertExists(proxied, 'YData is not subscribed before changes');

        this.yMap.delete(p);
        return Reflect.deleteProperty(target, p);
      },
    });
  };

  private _observer = (event: YMapEvent<unknown>) => {
    if (!event.transaction.local) {
      event.keysChanged.forEach(key => {
        const type = event.changes.keys.get(key);
        if (!type) {
          return;
        }
        if (type.action === 'delete') {
          delete this.map[key];
        } else if (type.action === 'add' || type.action === 'update') {
          const current = this.yMap.get(key);
          this._skipNext = true;
          this.map[key] = proxies.has(current)
            ? proxies.get(current)
            : createYProxy(current, this.options);
          this._skipNext = false;
        }
      });
    }
    this.options.onChange?.(this._proxy);
  };
}

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
        const data = new ReactiveYArray(
          value as unknown[],
          origin,
          options as ProxyOptions<unknown[]>
        );
        const proxy = data.proxy;
        proxies.set(origin, proxy);
        return proxy;
      }
      if (origin instanceof YMap) {
        const data = new ReactiveYMap(
          value as UnRecord,
          origin,
          options as ProxyOptions<UnRecord>
        );
        const proxy = data.proxy;
        proxies.set(origin, proxy);
        return proxy;
      }

      return value;
    },
  }) as Data;
}
