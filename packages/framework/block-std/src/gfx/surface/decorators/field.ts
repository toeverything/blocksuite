import type { GfxPrimitiveElementModel } from '../element-model.js';

import { getDecoratorState } from './common.js';
import { convertProps } from './convert.js';
import { getDerivedProps, updateDerivedProps } from './derive.js';
import { startObserve } from './observer.js';

const yPropsSetSymbol = Symbol('yProps');

export function getFieldPropsSet(target: unknown): Set<string | symbol> {
  const proto = Object.getPrototypeOf(target);
  // @ts-ignore
  if (!Object.hasOwn(proto, yPropsSetSymbol)) {
    // @ts-ignore
    proto[yPropsSetSymbol] = new Set();
  }

  // @ts-ignore
  return proto[yPropsSetSymbol] as Set<string | symbol>;
}

export function field<V, T extends GfxPrimitiveElementModel>(fallback?: V) {
  return function yDecorator(
    target: ClassAccessorDecoratorTarget<T, V>,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = context.name;

    return {
      init(this: GfxPrimitiveElementModel, v: V) {
        const yProps = getFieldPropsSet(this);

        yProps.add(prop);

        if (
          getDecoratorState(
            this.surface ?? Object.getPrototypeOf(this).constructor
          )?.skipField
        ) {
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
      get(this: GfxPrimitiveElementModel) {
        return (
          this.yMap.get(prop as string) ??
          this._preserved.get(prop as string) ??
          fallback
        );
      },
      set(this: T, originalVal: V) {
        const isCreating = getDecoratorState(this.surface)?.creating;

        if (getDecoratorState(this.surface)?.skipField) {
          return;
        }

        const derivedProps = getDerivedProps(prop, originalVal, this);
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
          updateDerivedProps(derivedProps, this);

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
