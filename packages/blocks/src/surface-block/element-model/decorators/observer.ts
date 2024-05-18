import type { Y } from '@blocksuite/store';

import type { ElementModel } from '../base.js';
import { setObjectMeta } from './common.js';

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
export function observe<This, E extends Y.YEvent<any>, T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ObserveFn<E, T>
) {
  return function observeDecorator(
    this: This,
    _: unknown,
    context: ClassFieldDecoratorContext
  ) {
    const prop = context.name;
    setObjectMeta(observeSymbol, this, prop, fn);
  };
}

function getObserveMeta(
  target: unknown,
  prop: string | symbol
): null | ObserveFn {
  // @ts-ignore
  return target[observeSymbol]?.[prop] ?? null;
}

export function startObserve(
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
