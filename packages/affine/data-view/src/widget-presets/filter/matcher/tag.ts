import type { FilterDefineType } from './matcher.js';

import { tBoolean, tTag } from '../../../core/logical/data-type.js';
import {
  tArray,
  tFunction,
  tTypeRef,
  tTypeVar,
} from '../../../core/logical/typesystem.js';

export const tagFilter = {
  isOneOf: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tTypeRef('options'), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    label: 'Is one of',
    impl: (value, target) => {
      if (!Array.isArray(target) || !target.length) {
        return true;
      }
      return target.includes(value);
    },
  },
  isNotOneOf: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tTypeRef('options'), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    label: 'Is not one of',
    impl: (value, target) => {
      if (!Array.isArray(target) || !target.length) {
        return true;
      }
      return !target.includes(value);
    },
  },
} as Record<string, FilterDefineType>;
