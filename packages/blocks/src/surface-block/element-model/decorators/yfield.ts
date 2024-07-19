import type { SurfaceElementModel } from '../base.js';

import { getDecoratorState } from './common.js';
import { convertProps } from './convert.js';
import { getDeriveProperties, updateDerivedProp } from './derive.js';
import { startObserve } from './observer.js';

const yPropsSetSymbol = Symbol('yProps');

export function getYFieldPropsSet(target: unknown): Set<string | symbol> {
  const proto = Object.getPrototypeOf(target);
  // @ts-ignore
  if (!Object.hasOwn(proto, yPropsSetSymbol)) {
    // @ts-ignore
    proto[yPropsSetSymbol] = new Set();
  }

  // @ts-ignore
  return proto[yPropsSetSymbol] as Set<string | symbol>;
}

export function yfield<V, T extends SurfaceElementModel>(fallback?: V) {
  // return function yDecorator(prototype: unknown, prop: string | symbol) {
  return function yDecorator(
    target: ClassAccessorDecoratorTarget<T, V>,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = context.name;

    return {
      init(this: SurfaceElementModel, v: V) {
        const yProps = getYFieldPropsSet(this);

        yProps.add(prop);

        if (getDecoratorState()?.skipYfield) {
          return;
        }

        if (this.yMap) {
          if (this.yMap.doc) {
            this.surface.doc.transact(() => {
              this.yMap.set(prop as string, v);
            });
          } else {
            this.yMap.set(prop as string, v);
            this._preserved.set(prop as string, v);
          }
        }
        return v;
      },
      get(this: SurfaceElementModel) {
        return (
          this.yMap.get(prop as string) ??
          this._preserved.get(prop as string) ??
          fallback
        );
      },
      set(this: T, originalVal: V) {
        const isCreating = getDecoratorState()?.creating;

        if (getDecoratorState()?.skipYfield) {
          return;
        }

        const derivedProps = getDeriveProperties(prop, originalVal, this);
        const val = isCreating
          ? originalVal
          : convertProps(prop, originalVal, this);
        const oldValue = target.get.call(this);

        if (this.yMap.doc) {
          this.surface.doc.transact(() => {
            this.yMap.set(prop as string, val);
          });
        } else {
          this.yMap.set(prop as string, val);
          this._preserved.set(prop as string, val);
        }

        startObserve(prop as string, this);

        if (!isCreating) {
          updateDerivedProp(derivedProps, this);

          this.surface['hooks'].update.emit({
            id: this.id,
            props: {
              [prop]: val,
            },
            oldValues: {
              [prop]: oldValue,
            },
          });
        }
      },
    } as ClassAccessorDecoratorResult<T, V>;
  };
}
