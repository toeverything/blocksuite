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

        const val = convertProps(prototype, prop, originalVal, this);

        if (this.yMap) {
          this.surface.page.transact(() => {
            this.yMap.set(prop as string, val);
          });
        }

        if (!this.yMap.doc) {
          this._preserved.set(prop as string, val);
        }
      },
    });
  };
}

export function local(): PropertyDecorator {
  return function localDecorator(target: unknown, prop: string | symbol) {
    Object.defineProperty(target, prop, {
      get(this: ElementModel) {
        return this._local.get(prop);
      },
      set(this: ElementModel, originalValue: unknown) {
        const oldValue = this._local.get(prop);
        const newVal = convertProps(target, prop, originalValue, this);

        this._local.set(prop, newVal);

        if (state.creating) return;

        updateDerivedProp(target, prop as string, originalValue, this);

        this._onChange({
          [prop]: {
            oldValue,
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

export function updateDerivedProp(
  target: unknown,
  prop: string | symbol,
  propValue: unknown,
  receiver: unknown
) {
  if (state.derive || state.creating) return;

  const deriveFn = getDerivedMeta(target, prop as string)!;

  if (deriveFn) {
    state.derive = true;
    const derived = deriveFn(propValue, receiver);
    keys(derived).forEach(key => {
      // @ts-ignore
      receiver[key] = derived[key];
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
