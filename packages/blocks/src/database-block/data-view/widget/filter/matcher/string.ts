import type { FilterDefineType } from './matcher.js';

import { tBoolean, tString } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';

export const stringFilter = {
  contains: {
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
    label: 'Contains',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
  doesNoContains: {
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
    label: 'Does no contains',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
  endsWith: {
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
    label: 'Ends with',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
  is: {
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
    label: 'Is',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
  isNot: {
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
    label: 'Is not',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
  startsWith: {
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
    label: 'Starts with',
    type: tFunction({
      args: [tString.create(), tString.create()],
      rt: tBoolean.create(),
    }),
  },
} as Record<string, FilterDefineType>;
