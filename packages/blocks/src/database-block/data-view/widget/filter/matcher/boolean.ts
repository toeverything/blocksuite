import type { FilterDefineType } from './matcher.js';

import { tBoolean } from '../../../logical/data-type.js';
import { tFunction } from '../../../logical/typesystem.js';

export const booleanFilter = {
  isChecked: {
    impl: value => {
      return !!value;
    },
    label: 'Is checked',
    type: tFunction({ args: [tBoolean.create()], rt: tBoolean.create() }),
  },
  isUnchecked: {
    impl: value => {
      return !value;
    },
    label: 'Is unchecked',
    type: tFunction({ args: [tBoolean.create()], rt: tBoolean.create() }),
  },
} satisfies Record<string, FilterDefineType>;
