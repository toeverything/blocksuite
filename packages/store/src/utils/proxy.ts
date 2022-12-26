import { Map as YMap } from 'yjs';

export interface EnhancedYMap<
  Data extends Record<string, unknown>,
  Keys extends keyof Data & string = keyof Data & string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> extends YMap<any> {
  clone(): EnhancedYMap<Data, Keys>;

  delete(key: Keys & string): void;

  set<Key extends Keys>(key: Key, value: Data[Key]): Data[Key];

  get<Key extends Keys>(key: Key): Data[Key];

  has<Key extends Keys>(key: Key): boolean;

  clear(): void;
}

export type ProxyConfig = {
  readonly?: boolean;
};

export function createYMapProxy<
  Data extends Record<string, unknown>,
  Keys extends keyof Data & string = keyof Data & string
>(yMap: EnhancedYMap<Data, Keys>, config?: ProxyConfig): Data;
export function createYMapProxy<
  Data extends Record<string, unknown>,
  Keys extends keyof Data & string = keyof Data & string
>(
  yMap: EnhancedYMap<Data, Keys>,
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
