import type { FilterDefineType } from './matcher.js';

import { tBoolean, tNumber } from '../../../core/logical/data-type.js';
import { tFunction } from '../../../core/logical/typesystem.js';

export const numberFilter = {
  greatThan: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '>',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value > target;
    },
  },
  greatThanOrEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '>=',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value >= target;
    },
  },
  lessThan: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '<',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value < target;
    },
  },
  lessThanOrEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '<=',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value <= target;
    },
  },
  equal: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '==',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value == target;
    },
  },
  notEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '!=',
    impl: (value, target) => {
      value = value ?? 0;
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value != target;
    },
  },
} as Record<string, FilterDefineType>;
