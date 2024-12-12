import type { Value, VariableRef } from '../expression/types.js';
import type { Filter } from './types.js';

import { filterMatcher } from './filter-fn/matcher.js';

const evalRef = (ref: VariableRef, row: Record<string, unknown>): unknown => {
  return row[ref.name];
};

const evalValue = (value?: Value): unknown => {
  return value?.value;
};
export const evalFilter = (
  filterGroup: Filter,
  row: Record<string, unknown>
): boolean => {
  const evalF = (filter: Filter): boolean => {
    if (filter.type === 'filter') {
      const value = evalRef(filter.left, row);
      const func = filterMatcher.getFilterByName(filter.function);
      if (!func) {
        return true;
      }
      const expectArgLen = func.args.length;
      const args: unknown[] = [];
      for (let i = 0; i < expectArgLen; i++) {
        const argValue = evalValue(filter.args[i]);
        const argType = func.args[i];
        if (argValue == null) {
          return true;
        }
        if (!argType.valueValidate(argValue)) {
          return true;
        }
        args.push(argValue);
      }
      const impl = func.impl;
      try {
        return impl(value ?? undefined, ...args);
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
  return evalF(filterGroup);
};
