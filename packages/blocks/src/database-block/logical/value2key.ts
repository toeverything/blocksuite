import type { TType } from './typesystem.js';
import { isTArray } from './typesystem.js';

export const value2key = (value: unknown, type: TType): string[] => {
  if (value == null) {
    return [''];
  }
  if (isTArray(type)) {
    return Array.isArray(value) ? value : [];
  }
  return [`${value}`];
};
