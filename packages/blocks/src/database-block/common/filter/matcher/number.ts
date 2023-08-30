import { tBoolean, tNumber } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';
import type { FilterDefineType } from './matcher.js';

export const numberFilter = {
  greatThan: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '>',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value > target
      );
    },
  },
  greatThanOrEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '>=',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value >= target
      );
    },
  },
  lessThan: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '<',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value < target
      );
    },
  },
  lessThanOrEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '<=',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value <= target
      );
    },
  },
  equal: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '==',
    impl: (value, target) => {
      return typeof value === 'number' && value == target;
    },
  },
  notEqual: {
    type: tFunction({
      args: [tNumber.create(), tNumber.create()],
      rt: tBoolean.create(),
    }),
    label: '!=',
    impl: (value, target) => {
      return typeof value === 'number' && value != target;
    },
  },
} as Record<string, FilterDefineType>;
