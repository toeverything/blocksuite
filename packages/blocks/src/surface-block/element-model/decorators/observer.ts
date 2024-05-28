import type { Y } from '@blocksuite/store';

import type { SurfaceElementModel } from '../base.js';
import { getObjectPropMeta, setObjectPropMeta } from './common.js';

const observeSymbol = Symbol('observe');
const observerDisposableSymbol = Symbol('observerDisposable');

type ObserveFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends Y.YEvent<any> = Y.YEvent<any>,
  T extends SurfaceElementModel = SurfaceElementModel,
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
export function observe<
  V,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends Y.YEvent<any>,
  T extends SurfaceElementModel,
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ObserveFn<E, T>
) {
  return function observeDecorator(
    _: unknown,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = context.name;
    return {
      init(this: T, v: V) {
        setObjectPropMeta(observeSymbol, Object.getPrototypeOf(this), prop, fn);
        return v;
      },
    } as ClassAccessorDecoratorResult<SurfaceElementModel, V>;
  };
}

function getObserveMeta(
  proto: unknown,
  prop: string | symbol
): null | ObserveFn {
  // @ts-ignore
  return getObjectPropMeta(proto, observeSymbol, prop);
}

export function startObserve(
  prop: string | symbol,
  receiver: SurfaceElementModel
) {
  const proto = Object.getPrototypeOf(receiver);
  const observeFn = getObserveMeta(proto, prop as string)!;
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

  const value = receiver[prop as keyof SurfaceElementModel] as
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
  proto: unknown,
  receiver: SurfaceElementModel
) {
  const observers = getObjectPropMeta(proto, observeSymbol);

  Object.keys(observers).forEach(prop => {
    startObserve(prop, receiver);
  });

  receiver['_disposable'].add(() => {
    // @ts-ignore
    Object.values(receiver[observerDisposableSymbol] ?? {}).forEach(dispose =>
      (dispose as () => void)()
    );
  });
}
