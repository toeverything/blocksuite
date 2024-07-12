import type { FilterDefineType } from './matcher.js';

import { tBoolean, tDate } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';

export const dateFilter = {
  after: {
    impl: (value, target) => {
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value > target;
    },
    label: 'After',
    type: tFunction({
      args: [tDate.create(), tDate.create()],
      rt: tBoolean.create(),
    }),
  },
  before: {
    impl: (value, target) => {
      if (typeof value !== 'number' || typeof target !== 'number') {
        return true;
      }
      return value < target;
    },
    label: 'Before',
    type: tFunction({
      args: [tDate.create(), tDate.create()],
      rt: tBoolean.create(),
    }),
  },
} as Record<string, FilterDefineType>;
