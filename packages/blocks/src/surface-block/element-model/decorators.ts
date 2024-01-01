import type { ElementModel } from './base.js';

export function ymap(): PropertyDecorator {
  return function yDecorator(target: unknown, prop: string | symbol) {
    const yMap = (target as ElementModel).yMap;

    Object.defineProperty(target, prop, {
      get() {
        return yMap.get(prop as string);
      },
      set(val) {
        yMap.set(prop as string, val);
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
