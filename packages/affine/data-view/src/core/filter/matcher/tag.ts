import { ct } from '../../logical/composite-type.js';
import { t } from '../../logical/data-type-presets.js';
import { tRef, tVar } from '../../logical/type-variable.js';
import { createFilter } from '../create-filter.js';

const optionName = 'options' as const;
export const tagFilter = [
  createFilter({
    name: 'isOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: tRef(optionName),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Is one of',
    shortString: () => '',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return false;
      }
      return value.includes(self);
    },
  }),
  createFilter({
    name: 'isNotOneOf',
    vars: [tVar(optionName, t.tag.instance())] as const,
    self: tRef(optionName),
    args: [ct.array.instance(tRef(optionName))] as const,
    label: 'Is not one of',
    shortString: () => 'not',
    impl: (self, value) => {
      if (!value.length) {
        return true;
      }
      if (self == null) {
        return true;
      }
      return !value.includes(self);
    },
  }),
];
