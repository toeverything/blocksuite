import { Map as YMap } from 'yjs';

export type DataInitializer<Data extends Record<string, unknown>> = {
  [Key in keyof Data]: Data[Key] extends Record<string, unknown>
    ? DataInitializer<Data[Key]>
    : () => Data[Key];
};

export type ProxyConfig<Data extends Record<string, unknown>> = {
  readonly?: boolean;
};

function initialize(object: Record<string, unknown>, yMap: YMap<unknown>) {
  yMap.forEach((value, key) => {
    object[key] = value;
  });
}

function subscribe(object: Record<string, unknown>, yMap: YMap<unknown>) {
  yMap.observe(event => {
    if (event.changes.keys.size === 0) {
      // skip empty event
      return;
    }
    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      if (!type) {
        console.error('impossible event', event);
        return;
      }
      if (type.action === 'delete') {
        delete object[key];
      } else if (type.action === 'add') {
        object[key] = yMap.get(key);
      } else if (type.action === 'update') {
        object[key] = yMap.get(key);
      }
    });
  });
}

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<unknown>,
  config: ProxyConfig<Data> = {}
): Data {
  const { readonly = false } = config;
  const object = {} as Data;
  if (!(yMap instanceof YMap)) {
    throw new TypeError();
  }
  initialize(object, yMap);
  subscribe(object, yMap);
  return new Proxy(object, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (readonly) {
        throw new Error('Modify data is not allowed');
      } else {
        if (typeof p === 'string') {
          yMap.set(p, value);
          return Reflect.set(target, p, value, receiver);
        } else {
          throw new Error('key cannot be a symbol');
        }
      }
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
  });
}
