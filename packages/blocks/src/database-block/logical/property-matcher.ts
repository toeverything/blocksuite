import { Matcher } from './matcher.js';
import type { TFunction } from './typesystem.js';
import {
  tArray,
  tDate,
  tFunction,
  tNumber,
  tString,
  tUnknown,
  typesystem,
} from './typesystem.js';

export const propertyMatcher = new Matcher<
  {
    name: string;
    impl: (...args: unknown[]) => unknown;
  },
  TFunction
>((type, target) => {
  if (type.type !== 'function') {
    return false;
  }
  const staticType = typesystem.subst(
    Object.fromEntries(type.typeVars?.map(v => [v.name, v.bound]) ?? []),
    type
  );
  const firstArg = staticType.args[0];
  return firstArg && typesystem.isSubtype(firstArg, target);
});

propertyMatcher.register(
  tFunction({
    args: [tString.create()],
    rt: tNumber.create(),
  }),
  {
    name: 'Length',
    impl: value => {
      if (typeof value !== 'string') {
        return 0;
      }
      return value.length;
    },
  }
);
propertyMatcher.register(
  tFunction({
    args: [tDate.create()],
    rt: tNumber.create(),
  }),
  {
    name: 'Day of month',
    impl: value => {
      if (typeof value !== 'number') {
        return 0;
      }
      return new Date(value).getDate();
    },
  }
);
propertyMatcher.register(
  tFunction({
    args: [tDate.create()],
    rt: tNumber.create(),
  }),
  {
    name: 'Day of week',
    impl: value => {
      if (typeof value !== 'number') {
        return 0;
      }
      return new Date(value).getDay();
    },
  }
);
propertyMatcher.register(
  tFunction({
    args: [tDate.create()],
    rt: tNumber.create(),
  }),
  {
    name: 'Month of year',
    impl: value => {
      if (typeof value !== 'number') {
        return 0;
      }
      return new Date(value).getMonth() + 1;
    },
  }
);
propertyMatcher.register(
  tFunction({
    args: [tArray(tUnknown.create())],
    rt: tNumber.create(),
  }),
  {
    name: 'Size',
    impl: value => {
      if (!Array.isArray(value)) {
        return 0;
      }
      return value.length;
    },
  }
);
