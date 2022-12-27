import { Map as YMap } from 'yjs';

export type ProxyConfig = {
  readonly?: boolean;
};

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<Data>,
  config?: ProxyConfig
): Data;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createYMapProxy(yMap: YMap<any>, config?: ProxyConfig): any;
export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<Data>,
  config: ProxyConfig = {
    readonly: false,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const { readonly = false } = config;
  if (!(yMap instanceof YMap)) {
    throw new TypeError();
  }
  return new Proxy(yMap, {
    has: (target, p) => {
      const has = Reflect.get(target, 'has');
      return Reflect.apply(has, target, [p]);
    },
    set: (target, p, value, receiver) => {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      } else {
        const set = Reflect.get(target, 'set', receiver);
        return Reflect.apply(set, target, [p, value]);
      }
    },
    get: (target, p, receiver) => {
      const get = Reflect.get(target, 'get', receiver);
      return Reflect.apply(get, target, [p]);
    },
  });
}
