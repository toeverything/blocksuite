import { keys } from '../../_common/utils/iterable.js';
import type { ElementModel } from './base.js';

const state = {
  skip: false,
  creating: false,
  derive: false,
};

export function setCreateState(
  creating: boolean,
  skipFieldInit: boolean
): void {
  state.skip = skipFieldInit;
  state.creating = creating;
}

export function yfield(fallback?: unknown): PropertyDecorator {
  return function yDecorator(prototype: unknown, prop: string | symbol) {
    // @ts-ignore
    const yProps = prototype['_yProps'] ?? new Set();
    // @ts-ignore
    prototype['_yProps'] = yProps;

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

        updateObserver(prototype, prop as string, this);
        updateDerivedProp(derivedProps, this);
      },
    });
  };
}

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

  const deriveFn = getDerivedMeta(prototype, prop as string)!;

  return deriveFn ? deriveFn(propValue, receiver) : null;
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
): null | ((propValue: unknown, instance: unknown) => Record<string, unknown>) {
  // @ts-ignore
  return target[deriveSymbol]?.[prop] ?? null;
}

/**
 * The derive decorator is used to derive other properties' update when the
 * decorated property is updated.
 * The decorator function will be called before the decorated property is updated.
 * The decorator function will not execute in model creation.
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
    setObjectMeta(deriveSymbol, target, prop as string, fn);
  };
}

const convertSymbol = Symbol('convert');

/**
 * The convert decorator is used to convert the property value before it's
 * set to the Y map.
 * This decorator function will not execute in model creation.
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

export function observe<T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (event: any, instance: T, type: 'modified' | 'altered') => void
) {
  return function observeDecorator(prototype: unknown, prop: string | symbol) {
    setObjectMeta(observeSymbol, prototype, prop, fn);
  };
}

function getObserveMeta(
  target: unknown,
  prop: string | symbol
):
  | null
  | ((
      event: unknown,
      instance: unknown,
      type: 'modified' | 'altered'
    ) => void) {
  // @ts-ignore
  return target[observeSymbol]?.[prop] ?? null;
}

function updateObserver(
  prototype: unknown,
  prop: string | symbol,
  receiver: ElementModel
) {
  const observeFn = getObserveMeta(prototype, prop as string)!;
  const observerDisposable = receiver['_observerDisposable'] ?? {};

  if (observerDisposable[prop]) {
    observerDisposable[prop]();
    delete observerDisposable[prop];
  }

  if (observeFn) {
    const value = receiver[prop as keyof ElementModel];

    observeFn(null, receiver, 'altered');

    // @ts-ignore
    try {
      const fn = (event: unknown) => {
        observeFn(event, receiver, 'modified');
      };

      // @ts-ignore
      value.observe(fn);
      receiver['_observerDisposable'][prop] = () => {
        // @ts-ignore
        value.unobserve(fn);
      };
    } catch {
      throw new Error(
        `Failed to observe "${prop.toString()}" of ${
          receiver.type
        } element, make sure it's a Y type.`
      );
    }
  }
}

export function initFieldObservers(prototype: unknown, receiver: ElementModel) {
  // @ts-ignore
  const observers = prototype[observeSymbol] ?? {};

  Object.keys(observers).forEach(prop => {
    updateObserver(prototype, prop, receiver);
  });
}
