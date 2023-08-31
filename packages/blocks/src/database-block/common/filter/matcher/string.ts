import { tBoolean, tString } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';
import type { FilterDefineType } from './matcher.js';

export const stringFilter = {
  is: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Is',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return value == target;
    },
  },
  isNot: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Is not',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return value != target;
    },
  },
  contains: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Contains',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return value.includes(target);
    },
  },
  doesNoContains: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Does no contains',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return !value.includes(target);
    },
  },
  startsWith: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Starts with',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return value.startsWith(target);
    },
  },
  endsWith: {
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
    label: 'Ends with',
    impl: (value, target) => {
      if (
        typeof value !== 'string' ||
        typeof target !== 'string' ||
        target === ''
      ) {
        return true;
      }
      return value.endsWith(target);
    },
  },
} as Record<string, FilterDefineType>;
