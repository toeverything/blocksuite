import type { ElementModel } from '../base.js';
import { setObjectMeta } from './common.js';

type WatchFn<T extends ElementModel = ElementModel> = (
  oldValue: unknown,
  instance: T,
  local: boolean
) => void;

const watchSymbol = Symbol('watch');

/**
 * The watch decorator is used to watch the property change of the element.
 * You can thinks of it as a decorator version of `elementUpdated` slot of the surface model.
 */
export function watch<T extends ElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: WatchFn<T>
) {
  return function watchDecorator(target: unknown, prop: string | symbol) {
    setObjectMeta(watchSymbol, target, prop, fn);
  };
}

function getWatchMeta(target: unknown, prop: string | symbol): null | WatchFn {
  // @ts-ignore
  return target[watchSymbol]?.[prop] ?? null;
}

function startWatch(
  prototype: unknown,
  prop: string | symbol,
  receiver: ElementModel
) {
  const watchFn = getWatchMeta(prototype, prop as string)!;

  if (!watchFn) return;

  receiver['_disposable'].add(
    receiver.surface.elementUpdated.on(payload => {
      if (payload.id === receiver.id && prop in payload.props) {
        watchFn(payload.oldValues[prop as string], receiver, payload.local);
      }
    })
  );
}

export function initializeWatchers(prototype: unknown, receiver: ElementModel) {
  // @ts-ignore
  const watchers = prototype[watchSymbol] ?? {};

  Object.keys(watchers).forEach(prop => {
    startWatch(prototype, prop, receiver);
  });
}
