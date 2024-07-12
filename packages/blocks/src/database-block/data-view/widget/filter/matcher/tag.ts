import type { FilterDefineType } from './matcher.js';

import { tBoolean, tTag } from '../../../logical/data-type.js';
import {
  tArray,
  tFunction,
  tTypeRef,
  tTypeVar,
} from '../../../logical/typesystem.js';

export const tagFilter = {
  isNotOneOf: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !target.length) {
        return true;
      }
      return !target.includes(value);
    },
    label: 'Is not one of',
    type: tFunction({
      args: [tTypeRef('options'), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
  isOneOf: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !target.length) {
        return true;
      }
      return target.includes(value);
    },
    label: 'Is one of',
    type: tFunction({
      args: [tTypeRef('options'), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
} as Record<string, FilterDefineType>;
