import type { ElementModel } from '../base.js';
import { getDecoratorState } from './common.js';
import { convertProps } from './convert.js';
import { getDeriveProperties, updateDerivedProp } from './derive.js';

/**
 * A decorator to mark the property as a local property.
 *
 * The local property act like it is a yfield property, but it's not synced to the Y map.
 * Updating local property will also trigger the `elementUpdated` slot of the surface model
 */
export function local(): PropertyDecorator {
  return function localDecorator(prototype: unknown, prop: string | symbol) {
    // @ts-ignore
    const localProps = prototype['_localProps'] ?? new Set();
    // @ts-ignore
    prototype['_localProps'] = localProps;

    localProps.add(prop);

    Object.defineProperty(prototype, prop, {
      get(this: ElementModel) {
        return this._local.get(prop);
      },
      set(this: ElementModel, originalValue: unknown) {
        const isCreating = getDecoratorState()?.creating;
        const oldValue = this._local.get(prop);
        // When state is creating, the value is considered as default value
        // hence there's no need to convert it
        const newVal = isCreating
          ? originalValue
          : convertProps(prototype, prop, originalValue, this);

        const derivedProps = getDeriveProperties(
          prototype,
          prop,
          originalValue,
          this
        );

        this._local.set(prop, newVal);

        // During creating, no need to invoke an update event and derive another update
        if (!isCreating) {
          updateDerivedProp(derivedProps, this);

          this._onChange({
            props: {
              [prop]: newVal,
            },
            oldValues: {
              [prop]: oldValue,
            },
            local: true,
          });

          this.surface['hooks'].update.emit({
            id: this.id,
            props: {
              [prop]: newVal,
            },
            oldValues: {
              [prop]: oldValue,
            },
          });
        }
      },
    });
  };
}
