import type { FilterDefineType } from './matcher.js';

import { tBoolean } from '../../../core/logical/data-type.js';
import { tFunction } from '../../../core/logical/typesystem.js';

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
