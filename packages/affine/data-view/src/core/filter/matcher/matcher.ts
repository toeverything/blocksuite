import { Matcher, MatcherCreator } from '../../logical/matcher.js';
import { type TFunction, typesystem } from '../../logical/typesystem.js';
import { booleanFilter } from './boolean.js';
import { dateFilter } from './date.js';
import { multiTagFilter } from './multi-tag.js';
import { numberFilter } from './number.js';
import { stringFilter } from './string.js';
import { tagFilter } from './tag.js';
import { unknownFilter } from './unknown.js';

export type FilterMatcherDataType<Args extends unknown[] = unknown[]> = {
  name: string;
  label: string;
  shortString: (...args: Args) => string;
  impl: (...args: Args) => boolean;
};
export type FilterDefineType = {
  type: TFunction;
} & Omit<FilterMatcherDataType, 'name'>;
const allFilter = {
  ...dateFilter,
  ...multiTagFilter,
  ...numberFilter,
  ...stringFilter,
  ...tagFilter,
  ...booleanFilter,
  ...unknownFilter,
};
const filterMatcherCreator = new MatcherCreator<
  FilterMatcherDataType,
  TFunction
>();
const filterMatchers = Object.entries(allFilter).map(
  ([name, { type, ...data }]) => {
    return filterMatcherCreator.createMatcher(type, {
      name: name,
      ...data,
    });
  }
);
export const filterMatcher = new Matcher<FilterMatcherDataType, TFunction>(
  filterMatchers,
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
