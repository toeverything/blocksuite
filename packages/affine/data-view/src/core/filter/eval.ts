import type { Value, VariableOrProperty } from '../expression/types.js';
import type { Filter } from './types.js';

import { propertyMatcher } from '../logical/property-matcher.js';
import { filterMatcher } from './matcher/matcher.js';

const evalRef = (
  ref: VariableOrProperty,
  row: Record<string, unknown>
): unknown => {
  if (ref.type === 'ref') {
    return row[ref.name];
  }
  const value = evalRef(ref.ref, row);
  const fn = propertyMatcher.findData(v => v.name === ref.propertyFuncName);
  try {
    return fn?.impl(value);
  } catch (e) {
    console.error(e);
    return;
  }
};

const evalValue = (value: Value, _row: Record<string, unknown>): unknown => {
  return value.value;
};
export const evalFilter = (
  filterGroup: Filter,
  row: Record<string, unknown>
): boolean => {
  const evalF = (filter: Filter): boolean => {
    if (filter.type === 'filter') {
      const value = evalRef(filter.left, row);
      const func = filterMatcher.getFilterByName(filter.function);
      const args = filter.args.map(value => evalValue(value, row));
      try {
        if ((func?.impl.length ?? 0) > args.length + 1) {
          // skip
          return true;
        }
        const impl = func?.impl(value, ...args);
        return impl ?? true;
      } catch (e) {
        console.error(e);
        return true;
      }
    } else if (filter.type === 'group') {
      if (filter.op === 'and') {
        return filter.conditions.every(f => evalF(f));
      } else if (filter.op === 'or') {
        return filter.conditions.some(f => evalF(f));
      }
    }
    return true;
  };
  // console.log(evalF(filterGroup))
  return evalF(filterGroup);
};
