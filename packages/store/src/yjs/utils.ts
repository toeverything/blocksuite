import { Array as YArray, Map as YMap, Text as YText } from 'yjs';

import { subscribeYArray } from './array.js';
import type { ProxyConfig } from './config.js';
import { subscribeYMap } from './map.js';
import { createYProxy } from './proxy.js';

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

export function toPlainValue(v: unknown): unknown {
  return v instanceof YMap || v instanceof YArray ? v.toJSON() : v;
}

export type UnRecord = Record<string, unknown>;

export function initialize(
  array: unknown[],
  yArray: YArray<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  object: UnRecord,
  yMap: YMap<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void;
export function initialize(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void {
  const { deep } = config;
  if (!(yAbstract instanceof YArray || yAbstract instanceof YMap)) {
    return;
  }
  yAbstract.forEach((value, key) => {
    const result =
      deep && (value instanceof YMap || value instanceof YArray)
        ? createYProxy(value, config)
        : value;

    (target as Record<string, unknown>)[key] = result;
  });
}

export function subscribeYEvent(
  arr: unknown[],
  yArray: YArray<unknown>,
  config: ProxyConfig
): void;
export function subscribeYEvent(
  object: UnRecord,
  yMap: YMap<unknown>,
  config: ProxyConfig
): void;
export function subscribeYEvent(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void;
export function subscribeYEvent(
  target: unknown[] | UnRecord,
  yAbstract: YArray<unknown> | YMap<unknown>,
  config: ProxyConfig
): void {
  if (yAbstract instanceof YArray) {
    subscribeYArray(target as unknown[], yAbstract, config);
    return;
  }

  if (yAbstract instanceof YMap) {
    subscribeYMap(target as UnRecord, yAbstract, config);
    return;
  }

  throw new Error();
}
