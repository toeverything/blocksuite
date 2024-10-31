import { t } from '../../logical/data-type-presets.js';
import { createFilter } from '../create-filter.js';

export const stringFilter = [
  createFilter({
    name: 'is',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Is',
    shortString: value => value.toString(),
    impl: (self = '', value) => {
      return self == value;
    },
  }),
  createFilter({
    name: 'isNot',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Is not',
    shortString: value => value.toString(),
    impl: (self = '', value) => {
      return self != value;
    },
  }),
  createFilter({
    name: 'contains',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Contains',
    shortString: () => 'contains',
    impl: (self = '', value) => {
      return self.includes(value);
    },
  }),
  createFilter({
    name: 'doesNoContains',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Does no contains',
    shortString: () => 'not contains',
    impl: (self = '', value) => {
      return !self.includes(value);
    },
  }),
  createFilter({
    name: 'startsWith',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Starts with',
    shortString: () => 'starts with',
    impl: (self = '', value) => {
      return self.startsWith(value);
    },
  }),
  createFilter({
    name: 'endsWith',
    self: t.string.instance(),
    args: [t.string.instance()] as const,
    label: 'Ends with',
    shortString: () => 'ends with',
    impl: (self = '', value) => {
      return self.endsWith(value);
    },
  }),
];
