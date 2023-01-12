import { Map as YMap, Array as YArray } from 'yjs';

export type DataInitializer<Data extends Record<string, unknown>> = {
  [Key in keyof Data]: Data[Key] extends Record<string, unknown>
    ? DataInitializer<Data[Key]>
    : () => Data[Key];
};

export type MapProxyConfig<Data extends Record<string, unknown>> = {
  readonly?: boolean;
  initializer?: DataInitializer<Partial<Data>>;
};

export type ArrayProxyConfig<Value> = {
  readonly?: boolean;
};

function initializeMap(object: Record<string, unknown>, yMap: YMap<unknown>) {
  yMap.forEach((value, key) => {
    object[key] = value;
  });
}

function subscribeMap(object: Record<string, unknown>, yMap: YMap<unknown>) {
  // fixme: cleanup the side effect
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

function initializeArray(array: unknown[], yArray: YArray<unknown>) {
  array.push(...yArray.toArray());
}

function subscribeArray(array: unknown[], yArray: YArray<unknown>) {
  yArray.observe(event => {
    // todo
  });
}

export function createYArrayProxy<Value = unknown>(
  yArray: YArray<unknown>,
  config: ArrayProxyConfig<Value> = {}
) {
  const { readonly = false } = config;
  const array: Value[] = [];
  if (!(yArray instanceof YArray)) {
    throw new TypeError();
  }
  initializeArray(array, yArray);
  subscribeArray(array, yArray);
  return new Proxy(array, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, newValue, receiver) => {
      if (readonly) {
        throw new Error('modify data is not allowed');
      } else {
        if (typeof p === 'string') {
          const idx = Number(p);
          if (Number.isFinite(idx) || Number.isNaN(idx)) {
            throw new Error('p is not a number');
          }
          yArray.delete(idx);
          yArray.insert(idx, newValue);
          return Reflect.set(target, p, newValue, receiver);
        } else {
          throw new Error('key cannot be a symbol');
        }
      }
    },
  });
}

export function createYMapProxy<Data extends Record<string, unknown>>(
  yMap: YMap<unknown>,
  config: MapProxyConfig<Data> = {}
): Data {
  const { readonly = false, initializer } = config;
  const object = {} as Data;
  if (!(yMap instanceof YMap)) {
    throw new TypeError();
  }
  initializeMap(object, yMap);
  subscribeMap(object, yMap);
  return new Proxy(object, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (readonly) {
        throw new Error('modify data is not allowed');
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
      if (
        typeof p === 'string' &&
        !yMap.has(p) &&
        typeof initializer?.[p] === 'function'
      ) {
        const value = (initializer[p] as () => unknown)();
        yMap.set(p, value);
        return value;
      }
      return Reflect.get(target, p, receiver);
    },
  });
}
