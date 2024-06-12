import { assertExists } from '@blocksuite/global/utils';
import type { YArrayEvent, YMapEvent } from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import { Boxed } from './boxed.js';
import type { UnRecord } from './utils.js';
import { BaseReactiveYData, native2Y, y2Native } from './utils.js';

export type ProxyOptions<T> = {
  onChange?: (data: T) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proxies = new WeakMap<any, BaseReactiveYData<any, any>>();

export class ReactiveYArray extends BaseReactiveYData<
  unknown[],
  YArray<unknown>
> {
  protected readonly _proxy: unknown[];

  constructor(
    protected readonly _source: unknown[],
    protected readonly _ySource: YArray<unknown>,
    protected readonly _options: ProxyOptions<unknown[]>
  ) {
    super();
    this._proxy = this._getProxy();
    proxies.set(_ySource, this);
    _ySource.observe(this._observer);
  }

  private _observer = (event: YArrayEvent<unknown>) => {
    this._onObserve(event, () => {
      let retain = 0;
      event.changes.delta.forEach(change => {
        if (change.retain) {
          retain += change.retain;
          return;
        }
        if (change.delete) {
          this._updateWithSkip(() => {
            this._source.splice(retain, change.delete);
          });
          return;
        }
        if (change.insert) {
          const _arr = [change.insert].flat();

          const proxyList = _arr.map(value => createYProxy(value));

          this._updateWithSkip(() => {
            this._source.splice(retain, 0, ...proxyList);
          });

          retain += change.insert.length;
        }
      });
    });
  };

  protected _getProxy = () => {
    return new Proxy(this._source, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        const index = Number(p);
        if (this._skipNext || Number.isNaN(index)) {
          return Reflect.set(target, p, value, receiver);
        }

        if (this._stashed.has(index)) {
          const result = Reflect.set(target, p, value, receiver);
          this._options.onChange?.(this._proxy);
          return result;
        }

        const reactive = proxies.get(this._ySource);
        assertExists(reactive, 'YData is not subscribed before changes');
        const doc = this._ySource.doc;
        assertExists(doc, 'YData is not bound to a Y.Doc');

        const yData = native2Y(value);
        this._transact(doc, () => {
          if (index < this._ySource.length) {
            this._ySource.delete(index, 1);
          }
          this._ySource.insert(index, [yData]);
        });
        const data = createYProxy(yData, this._options);
        return Reflect.set(target, p, data, receiver);
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target, p): boolean => {
        if (typeof p !== 'string') {
          throw new Error('key cannot be a symbol');
        }

        const proxied = proxies.get(this._ySource);
        assertExists(proxied, 'YData is not subscribed before changes');
        const doc = this._ySource.doc;
        assertExists(doc, 'YData is not bound to a Y.Doc');

        const index = Number(p);
        if (this._skipNext || Number.isNaN(index)) {
          return Reflect.deleteProperty(target, p);
        }

        this._transact(doc, () => {
          this._ySource.delete(index, 1);
        });
        return Reflect.deleteProperty(target, p);
      },
    });
  };

  stash(prop: number) {
    this._stashed.add(prop);
  }

  pop(prop: number) {
    const value = this._source[prop];
    this._stashed.delete(prop);
    this._proxy[prop] = value;
  }
}

export class ReactiveYMap extends BaseReactiveYData<UnRecord, YMap<unknown>> {
  protected readonly _proxy: UnRecord;

  constructor(
    protected readonly _source: UnRecord,
    protected readonly _ySource: YMap<unknown>,
    protected readonly _options: ProxyOptions<UnRecord>
  ) {
    super();
    this._proxy = this._getProxy();
    proxies.set(_ySource, this);
    _ySource.observe(this._observer);
  }

  private _observer = (event: YMapEvent<unknown>) => {
    this._onObserve(event, () => {
      event.keysChanged.forEach(key => {
        const type = event.changes.keys.get(key);
        if (!type) {
          return;
        }
        if (type.action === 'delete') {
          this._updateWithSkip(() => {
            delete this._source[key];
          });
        } else if (type.action === 'add' || type.action === 'update') {
          const current = this._ySource.get(key);
          this._updateWithSkip(() => {
            this._source[key] = proxies.has(current)
              ? proxies.get(current)
              : createYProxy(current, this._options);
          });
        }
      });
    });
  };

  protected _getProxy = () => {
    return new Proxy(this._source, {
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

        if (this._stashed.has(p)) {
          const result = Reflect.set(target, p, value, receiver);
          this._options.onChange?.(this._proxy);
          return result;
        }

        const reactive = proxies.get(this._ySource);
        assertExists(reactive, 'YData is not subscribed before changes');
        const doc = this._ySource.doc;
        assertExists(doc, 'YData is not bound to a Y.Doc');

        const yData = native2Y(value);
        this._transact(doc, () => {
          this._ySource.set(p, yData);
        });
        const data = createYProxy(yData, this._options);
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

        const proxied = proxies.get(this._ySource);
        assertExists(proxied, 'YData is not subscribed before changes');
        const doc = this._ySource.doc;
        assertExists(doc, 'YData is not bound to a Y.Doc');

        this._transact(doc, () => {
          this._ySource.delete(p);
        });

        return Reflect.deleteProperty(target, p);
      },
    });
  };

  stash(prop: string) {
    this._stashed.add(prop);
  }

  pop(prop: string) {
    const value = this._source[prop];
    this._stashed.delete(prop);
    this._proxy[prop] = value;
  }
}

export function createYProxy<Data>(
  yAbstract: unknown,
  options: ProxyOptions<Data> = {}
): Data {
  if (proxies.has(yAbstract)) {
    return proxies.get(yAbstract)!.proxy as Data;
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
        return data.proxy;
      }
      if (origin instanceof YMap) {
        const data = new ReactiveYMap(
          value as UnRecord,
          origin,
          options as ProxyOptions<UnRecord>
        );
        return data.proxy;
      }

      return value;
    },
  }) as Data;
}

export function stashProp(yMap: YMap<unknown>, prop: string): void;
export function stashProp(yMap: YArray<unknown>, prop: number): void;
export function stashProp(yAbstract: unknown, prop: string | number) {
  const proxy = proxies.get(yAbstract);
  assertExists(proxy, 'YData is not subscribed before changes');
  proxy.stash(prop);
}

export function popProp(yMap: YMap<unknown>, prop: string): void;
export function popProp(yMap: YArray<unknown>, prop: number): void;
export function popProp(yAbstract: unknown, prop: string | number) {
  const proxy = proxies.get(yAbstract);
  assertExists(proxy, 'YData is not subscribed before changes');
  proxy.pop(prop);
}
