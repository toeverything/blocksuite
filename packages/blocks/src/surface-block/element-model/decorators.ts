import type { ElementModel } from './base.js';

const state = {
  skip: false,
};

export function skipAssign(value: boolean): void {
  state.skip = value;
}

export function ymap(): PropertyDecorator {
  return function yDecorator(target: unknown, prop: string | symbol) {
    Object.defineProperty(target, prop, {
      get(this: ElementModel) {
        return this.yMap.get(prop as string);
      },
      set(this: ElementModel, val) {
        if (state.skip) {
          return;
        }

        if (this.yMap) {
          this.yMap.set(prop as string, val);
        } else {
          // @ts-ignore
          this._deferedInit = target._deferedInit ?? [];
          // @ts-ignore
          this._deferedInit.push({ key: prop as string, value: val });
        }
      },
    });
  };
}

export function local(): PropertyDecorator {
  return function localDecorator(target: unknown, prop: string | symbol) {
    // @ts-ignore
    let value;

    Object.defineProperty(target, prop, {
      get() {
        // @ts-ignore
        return value;
      },
      set(newVal) {
        value = newVal;
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

export function derive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (instance: any) => Record<string, unknown>
): PropertyDecorator {
  return function deriveDecorator(target: unknown, prop: string | symbol) {
    setDerivedMeta(target, prop as string, fn);
  };
}
