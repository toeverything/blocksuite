import type { SurfaceElementModel } from '../base.js';
import { getObjectPropMeta, setObjectPropMeta } from './common.js';

type WatchFn<T extends SurfaceElementModel = SurfaceElementModel> = (
  oldValue: unknown,
  instance: T,
  local: boolean
) => void;

const watchSymbol = Symbol('watch');

/**
 * The watch decorator is used to watch the property change of the element.
 * You can thinks of it as a decorator version of `elementUpdated` slot of the surface model.
 */
export function watch<V, T extends SurfaceElementModel>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: WatchFn<T>
) {
  return function watchDecorator(
    _: unknown,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = context.name;
    return {
      init(this: SurfaceElementModel, v: V) {
        setObjectPropMeta(watchSymbol, Object.getPrototypeOf(this), prop, fn);
        return v;
      },
    } as ClassAccessorDecoratorResult<SurfaceElementModel, V>;
  };
}

function getWatchMeta(proto: unknown, prop: string | symbol): null | WatchFn {
  return getObjectPropMeta(proto, watchSymbol, prop);
}

function startWatch(prop: string | symbol, receiver: SurfaceElementModel) {
  const proto = Object.getPrototypeOf(receiver);
  const watchFn = getWatchMeta(proto, prop as string)!;

  if (!watchFn) return;

  receiver['_disposable'].add(
    receiver.surface.elementUpdated.on(payload => {
      if (payload.id === receiver.id && prop in payload.props) {
        watchFn(payload.oldValues[prop as string], receiver, payload.local);
      }
    })
  );
}

export function initializeWatchers(
  prototype: unknown,
  receiver: SurfaceElementModel
) {
  const watchers = getObjectPropMeta(prototype, watchSymbol);

  Object.keys(watchers).forEach(prop => {
    startWatch(prop, receiver);
  });
}
