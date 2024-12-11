import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

export const booleanFilter = [
  createFilter({
    name: 'isChecked',
    self: t.boolean.instance(),
    args: [],
    label: 'Is checked',
    shortString: () => ': Checked',
    impl: value => {
      return !!value;
    },
    defaultValue: () => true,
  }),
  createFilter({
    name: 'isUnchecked',
    self: t.boolean.instance(),
    args: [],
    label: 'Is unchecked',
    shortString: () => ': Unchecked',
    impl: value => {
      return !value;
    },
    defaultValue: () => false,
  }),
];
