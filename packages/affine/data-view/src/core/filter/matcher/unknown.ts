import { t } from '../../logical/data-type-presets.js';
import { createFilter } from '../create-filter.js';

export const unknownFilter = [
  createFilter({
    name: 'isNotEmpty',
    self: t.unknown.instance(),
    args: [] as const,
    label: 'Is not empty',
    shortString: () => 'not empty',
    impl: self => {
      if (Array.isArray(self)) {
        return self.length > 0;
      }
      if (typeof self === 'string') {
        return !!self;
      }
      return self != null;
    },
  }),
  createFilter({
    name: 'isEmpty',
    self: t.unknown.instance(),
    args: [] as const,
    label: 'Is empty',
    shortString: () => 'empty',
    impl: self => {
      if (Array.isArray(self)) {
        return self.length === 0;
      }
      if (typeof self === 'string') {
        return !self;
      }
      return self == null;
    },
  }),
];
