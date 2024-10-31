import { t } from '../../logical/data-type-presets.js';
import { createFilter } from '../create-filter.js';

export const numberFilter = [
  createFilter({
    name: 'equal',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '=',
    shortString: () => '=',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self == target;
    },
  }),
  createFilter({
    name: 'notEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≠',
    shortString: () => '≠',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self != target;
    },
  }),
  createFilter({
    name: 'greatThan',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '>',
    shortString: () => '>',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self > target;
    },
  }),
  createFilter({
    name: 'lessThan',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '<',
    shortString: () => '<',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self < target;
    },
  }),
  createFilter({
    name: 'greatThanOrEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≥',
    shortString: () => '≥',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self >= target;
    },
  }),
  createFilter({
    name: 'lessThanOrEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≤',
    shortString: () => '≤',
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self <= target;
    },
  }),
];
