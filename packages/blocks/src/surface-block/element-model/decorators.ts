import type { ElementModel } from './base.js';

const state = {
  skip: false,
  creating: false,
};

export function setCreateState(
  creating: boolean,
  skipFieldInit: boolean
): void {
  state.skip = skipFieldInit;
  state.creating = creating;
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
    Object.defineProperty(target, prop, {
      get(this: ElementModel) {
        return this._localStore.get(prop);
      },
      set(this: ElementModel, newVal: unknown) {
        const oldValue = this._localStore.get(prop);

        this._localStore.set(prop, newVal);
        if (state.creating) return;
        this._onchange?.({
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

export function derive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (instance: any) => Record<string, unknown>
): PropertyDecorator {
  return function deriveDecorator(target: unknown, prop: string | symbol) {
    setDerivedMeta(target, prop as string, fn);
  };
}
