import { keys } from '../../../_common/utils/iterable.js';
import type { ElementModel } from '../base.js';
import { getDecoratorState, setObjectMeta } from './common.js';

const deriveSymbol = Symbol('derive');

function getDerivedMeta(
  target: unknown,
  prop: string | symbol
):
  | null
  | ((propValue: unknown, instance: unknown) => Record<string, unknown>)[] {
  // @ts-ignore
  return target[deriveSymbol]?.[prop] ?? null;
}

export function getDeriveProperties(
  prototype: unknown,
  prop: string | symbol,
  propValue: unknown,
  receiver: ElementModel
) {
  const decoratorState = getDecoratorState();

  if (decoratorState.deriving || decoratorState.creating) {
    return null;
  }

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
    const decoratorState = getDecoratorState();
    decoratorState.deriving = true;
    keys(derivedProps).forEach(key => {
      // @ts-ignore
      receiver[key] = derivedProps[key];
    });
    decoratorState.deriving = false;
  }
}

/**
 * The derive decorator is used to derive other properties' update when the
 * decorated property is updated through assignment in the local.
 *
 * Note:
 * 1. The first argument of the function is the new value of the decorated property
 *    before the `convert` decorator is called.
 * 2. The decorator function will execute after the decorated property has been updated.
 * 3. The decorator function will not execute during model creation.
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
