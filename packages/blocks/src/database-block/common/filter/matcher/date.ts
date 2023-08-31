import { tBoolean, tDate } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';
import type { FilterDefineType } from './matcher.js';

export const dateFilter = {
  before: {
    type: tFunction({
      args: [tDate.create(), tDate.create()],
      rt: tBoolean.create(),
    }),
    label: 'Before',
    impl: (value, target) => {
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value < target;
    },
  },
  after: {
    type: tFunction({
      args: [tDate.create(), tDate.create()],
      rt: tBoolean.create(),
    }),
    label: 'After',
    impl: (value, target) => {
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value > target;
    },
  },
} as Record<string, FilterDefineType>;
