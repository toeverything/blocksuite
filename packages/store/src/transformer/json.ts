import * as Y from 'yjs';

import { NATIVE_UNIQ_IDENTIFIER, TEXT_UNIQ_IDENTIFIER } from '../consts.js';
import { NativeWrapper } from '../yjs/native-wrapper.js';
import { Text } from '../yjs/text-adapter.js';

export function toJSON(value: unknown): unknown {
  if (value instanceof NativeWrapper) {
    return {
      [NATIVE_UNIQ_IDENTIFIER]: true,
      value: value.getValue(),
    };
  }
  if (value instanceof Text) {
    return {
      [TEXT_UNIQ_IDENTIFIER]: true,
      delta: value.yText.toDelta(),
    };
  }
  return value;
}

export function fromJSON(value: unknown): unknown {
  if (value instanceof Object) {
    if (Reflect.has(value, NATIVE_UNIQ_IDENTIFIER)) {
      return new NativeWrapper(Reflect.get(value, 'value'));
    }
    if (Reflect.has(value, TEXT_UNIQ_IDENTIFIER)) {
      const yText = new Y.Text();
      yText.applyDelta(Reflect.get(value, 'delta'));
      return new Text(yText);
    }
  }

  return value;
}
