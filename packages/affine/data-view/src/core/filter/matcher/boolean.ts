import { t } from '../../logical/data-type-presets.js';
import { createFilter } from '../create-filter.js';

export const booleanFilter = [
  createFilter({
    name: 'isChecked',
    self: t.boolean.instance(),
    args: [],
    label: 'Is checked',
    shortString: () => 'checked',
    impl: value => {
      return !!value;
    },
  }),
  createFilter({
    name: 'isUnchecked',
    self: t.boolean.instance(),
    args: [],
    label: 'Is unchecked',
    shortString: () => 'unchecked',
    impl: value => {
      return !value;
    },
  }),
];
