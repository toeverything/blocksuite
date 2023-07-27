import { tTag } from './data-type.js';
import type { TType } from './typesystem.js';
import { isTArray } from './typesystem.js';

export const value2key = (value: unknown, type: TType): [string, unknown][] => {
  if (value == null) {
    return [['', null]];
  }
  if (isTArray(type)) {
    if (!Array.isArray(value)) {
      return [];
    }
    if (value.length > 0) {
      return value.flatMap(value => value2key(value, type.ele));
    }
    return [['', null]];
  }
  return [[`:${value}`, value]];
};

export const defaultKey = (type: TType): [string, unknown][] => {
  if (tTag.is(type)) {
    return type.data?.tags.map(v => [`:${v.id}`, v.id]) ?? [];
  }
  if (isTArray(type)) {
    return defaultKey(type.ele);
  }
  return [];
};
