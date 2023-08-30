import { tBoolean, tTag } from '../../../logical/data-type.js';
import {
  tArray,
  tFunction,
  tTypeRef,
  tTypeVar,
} from '../../../logical/typesystem.js';
import type { FilterDefineType } from './matcher.js';

export const multiTagFilter = {
  containsAll: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    label: 'Contains all',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.every(v => value.includes(v))
      );
    },
  },
  containsOneOf: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    name: 'containsOneOf',
    label: 'Contains one of',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.some(v => value.includes(v))
      );
    },
  },
  doesNotContainsOneOf: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    label: 'Does not contains one of',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.every(v => !value.includes(v))
      );
    },
  },
  doesNotContainsAll: {
    type: tFunction({
      typeVars: [tTypeVar('options', tTag.create())],
      args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
      rt: tBoolean.create(),
    }),
    label: 'Does not contains all',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        !target.every(v => value.includes(v))
      );
    },
  },
} as Record<string, FilterDefineType>;
