import * as Y from 'yjs';

import { NATIVE_UNIQ_IDENTIFIER, TEXT_UNIQ_IDENTIFIER } from '../consts.js';
import { Boxed } from '../reactive/boxed.js';
import { isPureObject } from '../reactive/index.js';
import { Text } from '../reactive/text.js';

export function toJSON(value: unknown): unknown {
  if (value instanceof Boxed) {
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
  if (Array.isArray(value)) {
    return value.map(toJSON);
  }
  if (isPureObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => {
        return [key, toJSON(value)];
      })
    );
  }
  return value;
}

export function fromJSON(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(fromJSON);
  }
  if (value instanceof Object) {
    if (Reflect.has(value, NATIVE_UNIQ_IDENTIFIER)) {
      return new Boxed(Reflect.get(value, 'value'));
    }
    if (Reflect.has(value, TEXT_UNIQ_IDENTIFIER)) {
      const yText = new Y.Text();
      const deltas = Reflect.get(value, 'delta');
      for (const delta of deltas) {
        if (delta.insert) {
          delta.insert = delta.insert.replaceAll('\r\n', '\n');
        }
      }
      yText.applyDelta(deltas);
      return new Text(yText);
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => {
        return [key, fromJSON(value)];
      })
    );
  }

  return value;
}
