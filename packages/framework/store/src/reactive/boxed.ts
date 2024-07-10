import * as Y from 'yjs';

import { NATIVE_UNIQ_IDENTIFIER } from '../consts.js';

export class Boxed<T = unknown> {
  get yMap() {
    return this._map;
  }

  private readonly _map: Y.Map<T>;

  constructor(value: T) {
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
  }

  setValue(value: T) {
    return this._map.set('value', value);
  }

  getValue() {
    return this._map.get('value');
  }

  static is = (value: unknown): value is Boxed => {
    return (
      value instanceof Y.Map && value.get('type') === NATIVE_UNIQ_IDENTIFIER
    );
  };

  static from = <T>(map: Y.Map<T>): Boxed<T> => {
    return new Boxed<T>(map.get('value') as T);
  };
}
