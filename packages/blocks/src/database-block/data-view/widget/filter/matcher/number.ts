import type { FilterDefineType } from './matcher.js';

import { tBoolean, tNumber } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';

export const numberFilter = {
  equal: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value == target;
    },
    label: '==',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
  greatThan: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value > target;
    },
    label: '>',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
  greatThanOrEqual: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value >= target;
    },
    label: '>=',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
  lessThan: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value < target;
    },
    label: '<',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
  lessThanOrEqual: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value <= target;
    },
    label: '<=',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
  notEqual: {
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value != target;
    },
    label: '!=',
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
  },
} as Record<string, FilterDefineType>;
