import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

export const numberFilter = [
  createFilter({
    name: 'equal',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '=',
    shortString: v => (v ? ` = ${v.value}` : undefined),
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self == target;
    },
    defaultValue: args => args[0],
  }),
  createFilter({
    name: 'notEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≠',
    shortString: v => (v ? ` ≠ ${v.value}` : undefined),
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
    shortString: v => (v ? ` > ${v.value}` : undefined),
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self > target;
    },
    defaultValue: args => args[0] + 1,
  }),
  createFilter({
    name: 'lessThan',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '<',
    shortString: v => (v ? ` < ${v.value}` : undefined),
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self < target;
    },
    defaultValue: args => args[0] - 1,
  }),
  createFilter({
    name: 'greatThanOrEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≥',
    shortString: v => (v ? ` ≥ ${v.value}` : undefined),
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self >= target;
    },
    defaultValue: args => args[0],
  }),
  createFilter({
    name: 'lessThanOrEqual',
    self: t.number.instance(),
    args: [t.number.instance()] as const,
    label: '≤',
    shortString: v => (v ? ` ≤ ${v.value}` : undefined),
    impl: (self, target) => {
      if (self == null) {
        return false;
      }
      return self <= target;
    },
    defaultValue: args => args[0],
  }),
];
