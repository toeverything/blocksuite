import { Map as YMap } from 'yjs';

export type DataInitializer<Data extends Record<string, unknown>> = {
  [Key in keyof Data]: Data[Key] extends Record<string, unknown>
    ? DataInitializer<Data[Key]>
    : () => Data[Key];
};

export type ProxyConfig<Data extends Record<string, unknown>> = {
  readonly?: boolean;
  initializer?: DataInitializer<Partial<Data>>;
};

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<unknown>,
  config: ProxyConfig<Data> = {}
): Data {
  const { readonly = false, initializer } = config;
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
      const has = Reflect.get(target, 'has');
      if (!Reflect.apply(has, target, [p])) {
        if (typeof p === 'string' && typeof initializer?.[p] === 'function') {
          const set = Reflect.get(target, 'set', receiver);
          const defaultValue = (initializer[p] as () => unknown)();
          Reflect.apply(set, target, [p, defaultValue]);
        }
      }
      return Reflect.apply(get, target, [p]);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}
