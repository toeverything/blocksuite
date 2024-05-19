import type { ElementModel } from '../base.js';
import { getDecoratorState } from './common.js';
import { convertProps } from './convert.js';
import { getDeriveProperties, updateDerivedProp } from './derive.js';
import { startObserve } from './observer.js';

const yPropsSetSymbol = Symbol('yProps');

export function getYFieldPropsSet(prototype: unknown): Set<string | symbol> {
  // @ts-ignore
  if (!Object.hasOwn(prototype, yPropsSetSymbol)) {
    // @ts-ignore
    prototype[yPropsSetSymbol] = new Set();
  }

  // @ts-ignore
  return prototype[yPropsSetSymbol] as Set<string | symbol>;
}

export function yfield<V, T extends ElementModel>(fallback?: V) {
  // return function yDecorator(prototype: unknown, prop: string | symbol) {
  return function yDecorator(
    target: ClassAccessorDecoratorTarget<T, V>,
    context: ClassAccessorDecoratorContext
  ) {
    const prop = context.name;

    return {
      init(this: ElementModel, v: V) {
        const yProps = getYFieldPropsSet(this);

        yProps.add(prop);
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
      get(this: ElementModel) {
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

        const derivedProps = getDeriveProperties(this, prop, originalVal, this);
        const val = isCreating
          ? originalVal
          : convertProps(this, prop, originalVal, this);
        const oldValue = target.get.call(this);

        if (this.yMap.doc) {
          this.surface.doc.transact(() => {
            this.yMap.set(prop as string, val);
          });
        } else {
          this.yMap.set(prop as string, val);
          this._preserved.set(prop as string, val);
        }

        startObserve(this, prop as string, this);

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
