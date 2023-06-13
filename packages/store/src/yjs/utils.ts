import type { Doc as YDoc } from 'yjs';
import { Array as YArray, Map as YMap, Text as YText } from 'yjs';

export type Native2Y<T> = T extends Record<string, infer U>
  ? YMap<U>
  : T extends Array<infer U>
  ? YArray<U>
  : T;

export function isPureObject(value: unknown): value is object {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof YMap) &&
    !(value instanceof YArray) &&
    !(value instanceof YText)
  );
}

export function native2Y<T>(value: T, deep: boolean): Native2Y<T> {
  if (value instanceof YText) {
    if (value.doc) {
      return value.clone() as Native2Y<T>;
    }
    return value as Native2Y<T>;
  }
  if (Array.isArray(value)) {
    const yArray: YArray<unknown> = new YArray<unknown>();
    const result = value.map(item => {
      return deep ? native2Y(item, deep) : item;
    });
    yArray.insert(0, result);

    return yArray as Native2Y<T>;
  }
  if (isPureObject(value)) {
    const yMap = new YMap<unknown>();
    Object.entries(value).forEach(([key, value]) => {
      yMap.set(key, deep ? native2Y(value, deep) : value);
    });

    return yMap as Native2Y<T>;
  }

  return value as Native2Y<T>;
}

export type UnRecord = Record<string, unknown>;

export type SubdocEvent = {
  loaded: Set<YDoc>;
  removed: Set<YDoc>;
  added: Set<YDoc>;
};
