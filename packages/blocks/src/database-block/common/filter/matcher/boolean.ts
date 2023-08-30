import { tBoolean } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';
import type { FilterDefineType } from './matcher.js';

export const booleanFilter = {
  isChecked: {
    type: tFunction({ args: [tBoolean.create()], rt: tBoolean.create() }),
    label: 'Is checked',
    impl: value => {
      return !!value;
    },
  },
  isUnchecked: {
    type: tFunction({ args: [tBoolean.create()], rt: tBoolean.create() }),
    label: 'Is unchecked',
    impl: value => {
      return !value;
    },
  },
} satisfies Record<string, FilterDefineType>;
