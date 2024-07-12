import type { FilterDefineType } from './matcher.js';

import { tBoolean, tTag } from '../../../logical/data-type.js';
import {
  tArray,
  tFunction,
  tTypeRef,
  tTypeVar,
} from '../../../logical/typesystem.js';

export const multiTagFilter = {
  containsAll: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !Array.isArray(value) || !target.length) {
        return true;
      }
      return target.every(v => value.includes(v));
    },
    label: 'Contains all',
    type: tFunction({
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
  containsOneOf: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !Array.isArray(value) || !target.length) {
        return true;
      }
      return target.some(v => value.includes(v));
    },
    label: 'Contains one of',
    name: 'containsOneOf',
    type: tFunction({
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
  doesNotContainsAll: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !Array.isArray(value) || !target.length) {
        return true;
      }
      return !target.every(v => value.includes(v));
    },
    label: 'Does not contains all',
    type: tFunction({
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
  doesNotContainsOneOf: {
    impl: (value, target) => {
      if (!Array.isArray(target) || !Array.isArray(value) || !target.length) {
        return true;
      }
      return target.every(v => !value.includes(v));
    },
    label: 'Does not contains one of',
    type: tFunction({
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('options', tTag.create())],
    }),
  },
} as Record<string, FilterDefineType>;
