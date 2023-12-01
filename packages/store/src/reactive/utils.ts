import { Array as YArray, Map as YMap, Text as YText } from 'yjs';

import { Boxed } from './boxed.js';
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

export function native2Y<T>(value: T, deep = true): Native2Y<T> {
  if (value instanceof Boxed) {
    return value.yMap as Native2Y<T>;
  }
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

export function y2Native(
  yAbstract: unknown,
  {
    deep = true,
    transform = x => x,
  }: { deep?: boolean; transform: (value: unknown, origin: unknown) => unknown }
) {
  if (Boxed.is(yAbstract)) {
    const data = new Boxed(yAbstract);
    return transform(data, yAbstract);
  }
  if (yAbstract instanceof YText) {
    const data = new Text(yAbstract);
    return transform(data, yAbstract);
  }
  if (yAbstract instanceof YArray) {
    const data: unknown[] = yAbstract
      .toArray()
      .map(item => (deep ? y2Native(item, { deep, transform }) : item));

    return transform(data, yAbstract);
  }
  if (yAbstract instanceof YMap) {
    const data: Record<string, unknown> = Object.fromEntries(
      Array.from(yAbstract.entries()).map(([key, value]) => {
        return [key, deep ? y2Native(value, { deep, transform }) : value] as [
          string,
          unknown,
        ];
      })
    );
    return transform(data, yAbstract);
  }

  return transform(yAbstract, yAbstract);
}

export type UnRecord = Record<string, unknown>;
