import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

export const unknownFilter = [
  createFilter({
    name: 'isNotEmpty',
    self: t.unknown.instance(),
    args: [] as const,
    label: 'Is not empty',
    shortString: () => ': Is not empty',
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
    shortString: () => ': Is empty',
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
