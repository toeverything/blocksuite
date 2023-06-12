import { Matcher } from './matcher.js';
import type { TFunction } from './typesystem.js';
import {
  tArray,
  tBoolean,
  tDate,
  tFunction,
  tNumber,
  tString,
  tTag,
  tTypeRef,
  tTypeVar,
  tUnion,
  tUnknown,
  typesystem,
} from './typesystem.js';

export type FilterMatcherDataType = {
  name: string;
  impl: (...args: unknown[]) => boolean;
};
export const filterMatcher = new Matcher<FilterMatcherDataType, TFunction>(
  (type, target) => {
    if (type.type !== 'function') {
      return false;
    }
    const staticType = typesystem.subst(
      Object.fromEntries(type.typeVars?.map(v => [v.name, v.bound]) ?? []),
      type
    );
    const firstArg = staticType.args[0];
    return firstArg && typesystem.isSubtype(firstArg, target);
  }
);

filterMatcher.register(
  tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
  {
    name: 'Is not empty',
    impl: value => {
      if (typeof value === 'string') {
        return !!value;
      }
      return value != null;
    },
  }
);
filterMatcher.register(
  tFunction({ args: [tUnknown.create()], rt: tBoolean.create() }),
  {
    name: 'Is empty',
    impl: value => {
      if (typeof value === 'string') {
        return !value;
      }
      return value == null;
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Is',
    impl: (value, target) => {
      return value == target;
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Is not',
    impl: (value, target) => {
      return value != target;
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Contains',
    impl: (value, target) => {
      return (
        typeof value === 'string' &&
        typeof target === 'string' &&
        value.includes(target)
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Does no contains',
    impl: (value, target) => {
      return (
        typeof value === 'string' &&
        typeof target === 'string' &&
        !value.includes(target)
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Starts with',
    impl: (value, target) => {
      return (
        typeof value === 'string' &&
        typeof target === 'string' &&
        value.startsWith(target)
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tString.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Ends with',
    impl: (value, target) => {
      return (
        typeof value === 'string' &&
        typeof target === 'string' &&
        value.endsWith(target)
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tString.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: 'Characters less than',
    impl: (value, target) => {
      return (
        typeof value === 'string' &&
        typeof target === 'number' &&
        value.length < target
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '>',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value > target
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '>=',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value >= target
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '<',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value < target
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '<=',
    impl: (value, target) => {
      return (
        typeof value === 'number' &&
        typeof target === 'number' &&
        value <= target
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '==',
    impl: (value, target) => {
      return typeof value === 'number' && value == target;
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [tNumber.create(), tNumber.create()],
    rt: tBoolean.create(),
  }),
  {
    name: '!=',
    impl: (value, target) => {
      return typeof value === 'number' && value != target;
    },
  }
);
filterMatcher.register(
  tFunction({
    args: [
      tDate.create(),
      tUnion([
        tString.create({ value: 'Today' }),
        tString.create({ value: 'Yesterday' }),
        tString.create({ value: '2 days ago' }),
        tString.create({ value: '3 days ago' }),
        tString.create({ value: '4 days ago' }),
        tString.create({ value: '5 days ago' }),
        tString.create({ value: 'Last week' }),
      ]),
    ],
    rt: tBoolean.create(),
  }),
  {
    name: 'Is before',
    impl: (value, target) => {
      const targetDate = new Date();
      switch (target) {
        case 'Today':
          break;
        case 'Yesterday':
          targetDate.setDate(targetDate.getDate() - 1);
          break;
        case '2 days ago':
          targetDate.setDate(targetDate.getDate() - 2);
          break;
        case '3 days ago':
          targetDate.setDate(targetDate.getDate() - 3);
          break;
        case '4 days ago':
          targetDate.setDate(targetDate.getDate() - 4);
          break;
        case '5 days ago':
          targetDate.setDate(targetDate.getDate() - 5);
          break;
        case 'Last week':
          targetDate.setDate(targetDate.getDate() - targetDate.getDay());
          break;
      }
      return typeof value === 'number' && value < +targetDate;
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tTypeRef('options'), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Is inside',
    impl: (value, target) => {
      return Array.isArray(target) && target.includes(value);
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tTypeRef('options'), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Is not inside',
    impl: (value, target) => {
      return Array.isArray(target) && !target.includes(value);
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Contains all',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.every(v => value.includes(v))
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Contains one of',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.some(v => value.includes(v))
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Does not contains one of',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        target.every(v => !value.includes(v))
      );
    },
  }
);
filterMatcher.register(
  tFunction({
    typeVars: [tTypeVar('options', tTag.create())],
    args: [tArray(tTypeRef('options')), tArray(tTypeRef('options'))],
    rt: tBoolean.create(),
  }),
  {
    name: 'Does not contains all',
    impl: (value, target) => {
      return (
        Array.isArray(target) &&
        Array.isArray(value) &&
        !target.every(v => value.includes(v))
      );
    },
  }
);
