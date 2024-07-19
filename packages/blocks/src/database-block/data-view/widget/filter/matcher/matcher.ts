import type { TFunction } from '../../../logical/typesystem.js';

import { Matcher } from '../../../logical/matcher.js';
import { typesystem } from '../../../logical/typesystem.js';
import { booleanFilter } from './boolean.js';
import { dateFilter } from './date.js';
import { multiTagFilter } from './multi-tag.js';
import { numberFilter } from './number.js';
import { stringFilter } from './string.js';
import { tagFilter } from './tag.js';
import { unknownFilter } from './unknown.js';

export type FilterMatcherDataType = {
  name: string;
  label: string;
  impl: (...args: unknown[]) => boolean;
};
export type FilterDefineType = {
  type: TFunction;
} & Omit<FilterMatcherDataType, 'name'>;
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
const allFilter = {
  ...dateFilter,
  ...multiTagFilter,
  ...numberFilter,
  ...stringFilter,
  ...tagFilter,
  ...booleanFilter,
  ...unknownFilter,
};
Object.entries(allFilter).forEach(([name, { type, ...data }]) => {
  filterMatcher.register(type, {
    name: name,
    ...data,
  });
});
