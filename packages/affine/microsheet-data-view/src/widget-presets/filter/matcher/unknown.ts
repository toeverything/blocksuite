import type { FilterDefineType } from './matcher.js';

import { tBoolean } from '../../../core/logical/data-type.js';
import { tFunction, tUnknown } from '../../../core/logical/typesystem.js';

export const unknownFilter = {
  isNotEmpty: {
    type: tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
    label: 'Is not empty',
    impl: value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'string') {
        return !!value;
      }
      return value != null;
    },
  },
  isEmpty: {
    type: tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
    label: 'Is empty',
    impl: value => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      if (typeof value === 'string') {
        return !value;
      }
      return value == null;
    },
  },
} satisfies Record<string, FilterDefineType>;
