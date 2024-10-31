import { ct } from '../../logical/composite-type.js';
import { t } from '../../logical/data-type-presets.js';
import { tRef, tVar } from '../../logical/type-variable.js';
import { createFilter } from '../create-filter.js';

const optionName = 'option' as const;
export const multiTagFilter = [
  createFilter({
    name: 'containsAll',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Contains all',
    shortString: () => 'contains',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.every(v => self.includes(v));
    },
  }),
  createFilter({
    name: 'containsOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Contains one of',
    shortString: () => 'contains',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.some(v => self.includes(v));
    },
  }),
  createFilter({
    name: 'doesNotContainOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Does not contains one of',
    shortString: () => 'not contains',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return value.every(v => !self.includes(v));
    },
  }),
  createFilter({
    name: 'doesNotContainAll',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: ct.array.instance(tRef(optionName)),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Does not contains all',
    shortString: () => 'not contains',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return !value.every(v => self.includes(v));
    },
  }),
];
