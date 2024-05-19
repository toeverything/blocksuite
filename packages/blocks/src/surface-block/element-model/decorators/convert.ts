import type { ElementModel } from '../base.js';
import { setObjectMeta } from './common.js';

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
export function convert<V, T extends ElementModel>(
  fn: (propValue: V, instance: T) => unknown
) {
  return function convertDecorator(
    _: unknown,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = String(context.name);
    return {
      init(this: T, v: V) {
        setObjectMeta(convertSymbol, this, prop, fn);
        return v;
      },
    } as ClassAccessorDecoratorResult<T, V>;
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
