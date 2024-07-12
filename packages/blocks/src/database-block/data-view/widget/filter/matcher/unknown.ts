import type { FilterDefineType } from './matcher.js';

import { tBoolean } from '../../../logical/data-type.js';
import { tFunction, tUnknown } from '../../../logical/typesystem.js';

export const unknownFilter = {
  isEmpty: {
    impl: value => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      if (typeof value === 'string') {
        return !value;
      }
      return value == null;
    },
    label: 'Is empty',
    type: tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
  },
  isNotEmpty: {
    impl: value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'string') {
        return !!value;
      }
      return value != null;
    },
    label: 'Is not empty',
    type: tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
  },
} satisfies Record<string, FilterDefineType>;
