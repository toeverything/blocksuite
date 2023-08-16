import * as Y from 'yjs';

import { NativeWrapper } from './native-wrapper.js';

const TEXT_UNIQ_IDENTIFIER = '$blocksuite:internal:text$';
const NATIVE_UNIQ_IDENTIFIER = '$blocksuite:internal:native$';

export function toJSON(value: unknown): unknown {
  if (value instanceof Y.Doc) {
    throw new Error('Y.Doc is not supported');
  }
  if (value instanceof NativeWrapper) {
    return {
      [NATIVE_UNIQ_IDENTIFIER]: true,
      value: value.getValue(),
    };
  }
  if (value instanceof Y.Text) {
    return {
      [TEXT_UNIQ_IDENTIFIER]: true,
      delta: value.toDelta(),
    };
  }
  if (value instanceof Y.Map) {
    const json: Record<string, unknown> = {};
    value.forEach((v, k) => {
      json[k] = toJSON(v);
    });
    return json;
  }
  if (value instanceof Y.Array) {
    return value.toArray().map(x => toJSON(x));
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
      return yText;
    }
    const yMap = new Y.Map<unknown>();
    Object.entries(value).forEach(([key, value]) => {
      yMap.set(key, fromJSON(value));
    });

    return yMap;
  }
  if (Array.isArray(value)) {
    const yArray = new Y.Array<unknown>();
    const result = value.map(item => fromJSON(item));
    yArray.insert(0, result);
    return yArray;
  }

  return value;
}
