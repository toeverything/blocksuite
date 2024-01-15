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
      set(this: ElementModel, val) {
        if (state.skip) {
          return;
        }

        if (this.yMap) {
          this.surface.page.transact(() => {
            this.yMap.set(prop as string, val);
          });
        }

        if (!this.yMap.doc) {
          this._preserved.set(prop as string, val);
        }

        updateDerivedProp(prototype, prop as string, this);
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
      set(this: ElementModel, newVal: unknown) {
        const oldValue = this._local.get(prop);

        this._local.set(prop, newVal);
        if (state.creating) return;
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

function setDerivedMeta(
  target: unknown,
  prop: string | symbol,
  fn: (instance: unknown) => Record<string, unknown>
) {
  // @ts-ignore
  target[deriveSymbol] = target[deriveSymbol] ?? {};
  // @ts-ignore
  target[deriveSymbol][prop] = fn;
}

export function updateDerivedProp(
  target: unknown,
  prop: string | symbol,
  receiver: unknown
) {
  if (state.derive || state.creating) return;

  const deriveFn = getDerivedMeta(target, prop as string)!;

  if (deriveFn) {
    state.derive = true;
    const derived = deriveFn(receiver);
    keys(derived).forEach(key => {
      // @ts-ignore
      receiver[key] = derived[key];
    });
    state.derive = false;
  }
}

export function getDerivedMeta(
  target: unknown,
  prop: string | symbol
): null | ((instance: unknown) => Record<string, unknown>) {
  // @ts-ignore
  return target[deriveSymbol]?.[prop] ?? null;
}

export function derive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (instance: any) => Record<string, unknown>
): PropertyDecorator {
  return function deriveDecorator(target: unknown, prop: string | symbol) {
    setDerivedMeta(target, prop as string, fn);
  };
}
