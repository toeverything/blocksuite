import * as Y from 'yjs';

import { NATIVE_UNIQ_IDENTIFIER } from '../consts.js';

export type OnBoxedChange = (data: unknown) => void;

export class Boxed<T = unknown> {
  private readonly _map: Y.Map<T>;

  private _onChange?: OnBoxedChange;

  static from = <T>(map: Y.Map<T>, onChange?: OnBoxedChange): Boxed<T> => {
    return new Boxed<T>(map.get('value') as T, onChange);
  };

  static is = (value: unknown): value is Boxed => {
    return (
      value instanceof Y.Map && value.get('type') === NATIVE_UNIQ_IDENTIFIER
    );
  };

  getValue = () => {
    return this._map.get('value');
  };

  setValue = (value: T) => {
    return this._map.set('value', value);
  };

  constructor(value: T, onChange?: OnBoxedChange) {
    this._onChange = onChange;
    if (
      value instanceof Y.Map &&
      value.get('type') === NATIVE_UNIQ_IDENTIFIER
    ) {
      this._map = value;
    } else {
      this._map = new Y.Map();
      this._map.set('type', NATIVE_UNIQ_IDENTIFIER as T);
      this._map.set('value', value);
    }
    this._map.observeDeep(() => {
      this._onChange?.(this.getValue());
    });
  }

  bind(onChange: OnBoxedChange) {
    this._onChange = onChange;
  }

  get yMap() {
    return this._map;
  }
}
