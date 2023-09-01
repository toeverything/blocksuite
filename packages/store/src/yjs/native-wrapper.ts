import * as Y from 'yjs';

import { NATIVE_UNIQ_IDENTIFIER } from '../consts.js';

export class NativeWrapper<T = unknown> {
  private readonly _map: Y.Map<T>;
  static is = (value: unknown): value is NativeWrapper => {
    return (
      value instanceof Y.Map && value.get('type') === NATIVE_UNIQ_IDENTIFIER
    );
  };

  static from = <T>(map: Y.Map<T>): NativeWrapper<T> => {
    return new NativeWrapper<T>(map.get('value') as T);
  };

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

  get yMap() {
    return this._map;
  }

  setValue(value: T) {
    return this._map.set('value', value);
  }

  getValue() {
    return this._map.get('value');
  }
}
