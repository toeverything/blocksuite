import { t } from '../../logical/data-type-presets.js';
import { createFilter } from '../create-filter.js';

export const dateFilter = [
  createFilter({
    name: 'before',
    self: t.date.instance(),
    args: [t.date.instance()] as const,
    label: 'Before',
    shortString: () => 'before',
    impl: (self, value) => {
      if (self == null) {
        return false;
      }
      return self < value;
    },
  }),
  createFilter({
    name: 'after',
    self: t.date.instance(),
    args: [t.date.instance()] as const,
    label: 'After',
    shortString: () => 'after',
    impl: (self, value) => {
      if (self == null) {
        return false;
      }
      return self > value;
    },
  }),
];
