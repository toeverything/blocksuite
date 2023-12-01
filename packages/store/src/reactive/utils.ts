import { Array as YArray, Map as YMap } from 'yjs';

import { Text } from './text.js';

export type Native2Y<T> = T extends Record<string, infer U>
  ? YMap<U>
  : T extends Array<infer U>
    ? YArray<U>
    : T;

export function isPureObject(value: unknown): value is object {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]' &&
    [Object, undefined, null].some(x => x === value.constructor)
  );
}

export function canToProxy(
  value: unknown
): value is YMap<unknown> | YArray<unknown> {
  return value instanceof YArray || value instanceof YMap;
}

export function canToY(
  value: unknown
): value is unknown | Record<string, unknown> {
  return isPureObject(value) || Array.isArray(value);
}

export function native2Y<T>(value: T, deep: boolean): Native2Y<T> {
  if (value instanceof Text) {
    if (value.yText.doc) {
      return value.yText.clone() as Native2Y<T>;
    }
    return value.yText as Native2Y<T>;
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
