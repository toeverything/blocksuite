import type { Y } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import type { ElementModel } from './base.js';

const state = {
  /**
   * Skip the field initialization during the model creation.
   */
  skip: false,

  /**
   * Whether the model is creating.
   */
  creating: false,

  /**
   * Whether the model is in the derive process.
   */
  derive: false,
};

export function setCreateState(
  creating: boolean,
  skipFieldInit: boolean
): void {
  state.skip = skipFieldInit;
  state.creating = creating;
}

const yPropsSetSymbol = Symbol('yProps');

export function getYFieldPropsSet(prototype: unknown): Set<string | symbol> {
  // @ts-ignore
  if (!Object.hasOwn(prototype, yPropsSetSymbol)) {
    // @ts-ignore
    prototype[yPropsSetSymbol] = new Set();
  }

  // @ts-ignore
  return prototype[yPropsSetSymbol] as Set<string | symbol>;
}

export function yfield(fallback?: unknown): PropertyDecorator {
  return function yDecorator(prototype: unknown, prop: string | symbol) {
    const yProps = getYFieldPropsSet(prototype);

    yProps.add(prop);

    Object.defineProperty(prototype, prop, {
      get(this: ElementModel) {
        return (
          this.yMap.get(prop as string) ??
          this._preserved.get(prop as string) ??
          fallback
        );
      },
      set(this: ElementModel, originalVal) {
        if (state.skip) {
          return;
        }

        const derivedProps = getDeriveProperties(
          prototype,
          prop,
          originalVal,
          this
        );
        const val = state.creating
          ? originalVal
          : convertProps(prototype, prop, originalVal, this);

        if (this.yMap) {
          if (this.yMap.doc) {
            this.surface.doc.transact(() => {
              this.yMap.set(prop as string, val);
            });
          } else {
            this.yMap.set(prop as string, val);
          }
        }

        if (!this.yMap.doc) {
          this._preserved.set(prop as string, val);
        }

        startObserve(prototype, prop as string, this);
        updateDerivedProp(derivedProps, this);
      },
    });
  };
}

/**
 * A decorator to mark the property as a local property.
 *
 * The local property act like it is a yfield property, but it's not synced to the Y map.
 * Updating local property will also trigger the `elementUpdated` slot of the surface model
 */
export function local(): PropertyDecorator {
  return function localDecorator(prototype: unknown, prop: string | symbol) {
    // @ts-ignore
    const localProps = prototype['_localProps'] ?? new Set();
    // @ts-ignore
    prototype['_localProps'] = localProps;

    localProps.add(prop);

    Object.defineProperty(prototype, prop, {
      get(this: ElementModel) {
        return this._local.get(prop);
      },
      set(this: ElementModel, originalValue: unknown) {
        const oldValue = this._local.get(prop);
        const newVal = state.creating
          ? originalValue
          : convertProps(prototype, prop, originalValue, this);

        const derivedProps = getDeriveProperties(
          prototype,
          prop,
          originalValue,
          this
        );

        this._local.set(prop, newVal);

        if (state.creating) return;

        updateDerivedProp(derivedProps, this);

        this._onChange({
          props: {
            [prop]: newVal,
          },
          oldValues: {
            [prop]: oldValue,
          },
          local: true,
        });
      },
    });
  };
}

const deriveSymbol = Symbol('derive');

function setObjectMeta(
  symbol: symbol,
  target: unknown,
  prop: string | symbol,
  val: unknown
) {
  // @ts-ignore
  target[symbol] = target[symbol] ?? {};
  // @ts-ignore
  target[symbol][prop] = val;
}

export function getDeriveProperties(
  prototype: unknown,
  prop: string | symbol,
  propValue: unknown,
  receiver: unknown
) {
  if (state.derive || state.creating) return null;

  const deriveFns = getDerivedMeta(prototype, prop as string)!;

  return deriveFns
    ? deriveFns.reduce(
        (derivedProps, fn) => {
          const props = fn(propValue, receiver);

          Object.entries(props).forEach(([key, value]) => {
            derivedProps[key] = value;
          });

          return derivedProps;
        },
        {} as Record<string, unknown>
      )
    : null;
}

export function updateDerivedProp(
  derivedProps: Record<string, unknown> | null,
  receiver: ElementModel
) {
  if (derivedProps) {
    state.derive = true;
    keys(derivedProps).forEach(key => {
      // @ts-ignore
      receiver[key] = derivedProps[key];
    });
    state.derive = false;
  }
}

function getDerivedMeta(
  target: unknown,
  prop: string | symbol
):
  | null
  | ((propValue: unknown, instance: unknown) => Record<string, unknown>)[] {
  // @ts-ignore
  return target[deriveSymbol]?.[prop] ?? null;
}

/**
 * The derive decorator is used to derive other properties' update when the
 * decorated property is updated through assignment in the local.
 *
 * Note:
 * 1. The first argument of the function is the new value of the decorated property
 *    before the `convert` decorator is called.
 * 2. The decorator function will execute after the decorated property has been updated.
 * 3. The decorator function will not execute in model creation.
 * 4. The decorator function will not execute if the decorated property is updated through
 *    the Y map. That is to say, if other peers update the property will not trigger this decorator
 * @param fn
 * @returns
 */
export function derive<T extends ElementModel>(
  fn: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propValue: any,
    instance: T
  ) => Record<string, unknown>
): PropertyDecorator {
  return function deriveDecorator(target: unknown, prop: string | symbol) {
    const derived = getDerivedMeta(target, prop as string);

    if (Array.isArray(derived)) {
      derived.push(fn as (typeof derived)[0]);
    } else {
      setObjectMeta(deriveSymbol, target, prop as string, [fn]);
    }
  };
}

const convertSymbol = Symbol('convert');

/**
 * The convert decorator is used to convert the property value before it's
 * set to the Y map.
 *
 * Note:
 * 1. This decorator function will not execute in model initialization.
 * @param fn
 * @returns
 */
export function convert<T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (propValue: any, instance: T) => unknown
) {
  return function convertDecorator(target: unknown, prop: string | symbol) {
    setObjectMeta(convertSymbol, target, prop as string, fn);
  };
}

export function getConvertMeta(
  target: unknown,
  prop: string | symbol
): null | ((propValue: unknown, instance: unknown) => unknown) {
  // @ts-ignore
  return target[convertSymbol]?.[prop] ?? null;
}

export function convertProps(
  target: unknown,
  propKey: string | symbol,
  newProp: unknown,
  receiver: unknown
) {
  const convertFn = getConvertMeta(target, propKey as string)!;

  return convertFn ? convertFn(newProp, receiver) : newProp;
}

const observeSymbol = Symbol('observe');
const observerDisposableSymbol = Symbol('observerDisposable');

type ObserveFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends Y.YEvent<any> = Y.YEvent<any>,
  T extends ElementModel = ElementModel,
> = (
  /**
   * The event object of the Y.Map or Y.Array, the `null` value means the observer is initializing.
   */
  event: E | null,
  instance: T,
  /**
   * The transaction object of the Y.Map or Y.Array, the `null` value means the observer is initializing.
   */
  transaction: Y.Transaction | null
) => void;

/**
 * A decorator to observe the y type property.
 * You can think of it is just a decorator version of 'observe' method of Y.Array and Y.Map.
 *
 * The observer function start to observe the property when the model is mounted. And it will
 * re-observe the property automatically when the value is altered.
 * @param fn
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function observe<E extends Y.YEvent<any>, T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ObserveFn<E, T>
) {
  return function observeDecorator(prototype: unknown, prop: string | symbol) {
    setObjectMeta(observeSymbol, prototype, prop, fn);
  };
}

function getObserveMeta(
  target: unknown,
  prop: string | symbol
): null | ObserveFn {
  // @ts-ignore
  return target[observeSymbol]?.[prop] ?? null;
}

function startObserve(
  prototype: unknown,
  prop: string | symbol,
  receiver: ElementModel
) {
  const observeFn = getObserveMeta(prototype, prop as string)!;
  // @ts-ignore
  const observerDisposable = receiver[observerDisposableSymbol] ?? {};

  // @ts-ignore
  receiver[observerDisposableSymbol] = observerDisposable;

  if (observerDisposable[prop]) {
    observerDisposable[prop]();
    delete observerDisposable[prop];
  }

  if (!observeFn) {
    return;
  }

  const value = receiver[prop as keyof ElementModel] as
    | Y.Map<unknown>
    | Y.Array<unknown>
    | null;

  observeFn(null, receiver, null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (event: Y.YEvent<any>, transaction: Y.Transaction) => {
    observeFn(event, receiver, transaction);
  };

  if (value && 'observe' in value) {
    value.observe(fn);

    observerDisposable[prop] = () => {
      value.unobserve(fn);
    };
  } else {
    console.warn(
      `Failed to observe "${prop.toString()}" of ${
        receiver.type
      } element, make sure it's a Y type.`
    );
  }
}

export function initializedObservers(
  prototype: unknown,
  receiver: ElementModel
) {
  // @ts-ignore
  const observers = prototype[observeSymbol] ?? {};

  Object.keys(observers).forEach(prop => {
    startObserve(prototype, prop, receiver);
  });

  receiver['_disposable'].add(() => {
    // @ts-ignore
    Object.values(receiver[observerDisposableSymbol] ?? {}).forEach(dispose =>
      (dispose as () => void)()
    );
  });
}

const watchSymbol = Symbol('watch');
type WatchFn<T extends ElementModel = ElementModel> = (
  oldValue: unknown,
  instance: T,
  local: boolean
) => void;

/**
 * The watch decorator is used to watch the property change of the element.
 * You can thinks of it as a decorator version of `elementUpdated` slot of the surface model.
 */
export function watch<T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: WatchFn<T>
) {
  return function watchDecorator(target: unknown, prop: string | symbol) {
    setObjectMeta(watchSymbol, target, prop, fn);
  };
}

function getWatchMeta(target: unknown, prop: string | symbol): null | WatchFn {
  // @ts-ignore
  return target[watchSymbol]?.[prop] ?? null;
}

function startWatch(
  prototype: unknown,
  prop: string | symbol,
  receiver: ElementModel
) {
  const watchFn = getWatchMeta(prototype, prop as string)!;

  if (!watchFn) return;

  receiver['_disposable'].add(
    receiver.surface.elementUpdated.on(payload => {
      if (payload.id === receiver.id && prop in payload.props) {
        watchFn(payload.oldValues[prop as string], receiver, payload.local);
      }
    })
  );
}

export function initializeWatchers(prototype: unknown, receiver: ElementModel) {
  // @ts-ignore
  const watchers = prototype[watchSymbol] ?? {};

  Object.keys(watchers).forEach(prop => {
    startWatch(prototype, prop, receiver);
  });
}
