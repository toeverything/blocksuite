import { ct } from '../../logical/composite-type.js';
import { t } from '../../logical/index.js';
import type { TypeInstance } from '../../logical/type.js';
import { typeSystem } from '../../logical/type-system.js';
import { booleanFilter } from './boolean.js';
import type { FilterConfig } from './create.js';
import { dateFilter } from './date.js';
import { multiTagFilter } from './multi-tag.js';
import { numberFilter } from './number.js';
import { stringFilter } from './string.js';
import { tagFilter } from './tag.js';
import { unknownFilter } from './unknown.js';

const allFilter = [
  ...dateFilter,
  ...multiTagFilter,
  ...numberFilter,
  ...stringFilter,
  ...tagFilter,
  ...booleanFilter,
  ...unknownFilter,
] as FilterConfig[];

const getPredicate = (selfType: TypeInstance) => (filter: FilterConfig) => {
  const fn = ct.fn.instance(
    [filter.self, ...filter.args],
    t.boolean.instance(),
    filter.vars
  );
  const staticType = fn.subst(
    Object.fromEntries(
      filter.vars?.map(v => [
        v.varName,
        {
          define: v,
          type: v.typeConstraint,
        },
      ]) ?? []
    )
  );
  if (!staticType) {
    return false;
  }
  const firstArg = staticType.args[0];
  return firstArg && typeSystem.unify(selfType, firstArg);
};

export const filterMatcher = {
  filterListBySelfType: (selfType: TypeInstance) => {
    return allFilter.filter(getPredicate(selfType));
  },
  firstMatchedBySelfType: (selfType: TypeInstance) => {
    return allFilter.find(getPredicate(selfType));
  },
  getFilterByName: (name?: string) => {
    if (!name) {
      return;
    }
    return allFilter.find(v => v.name === name);
  },
};
