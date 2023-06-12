import type { Filter, Value, VariableOrProperty } from '../common/ast.js';
import { filterMatcher } from './filter-matcher.js';
import { propertyMatcher } from './property-matcher.js';

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

const evalValue = (value: Value, row: Record<string, unknown>): unknown => {
  return value.value;
  //TODO
  // switch (value.type) {
  //     case "ref":
  //         return evalRef(value, row)
  //     case "literal":
  //         return value.value;
  // }
};
export const evalFilter = (
  filterGroup: Filter,
  row: Record<string, unknown>
) => {
  const evalF = (filter: Filter): unknown => {
    if (filter.type === 'filter') {
      const value = evalRef(filter.left, row);
      const func = filterMatcher.findData(v => v.name === filter.function);
      const args = filter.args.map(value => evalValue(value, row));
      try {
        if ((func?.impl.length ?? 0) > args.length + 1) {
          // skip
          return true;
        }
        const impl = func?.impl(value, ...args);
        return impl;
      } catch (e) {
        console.error(e);
        return;
      }
    } else if (filter.type === 'group') {
      if (filter.op === 'and') {
        return filter.conditions.every(f => evalF(f));
      } else if (filter.op === 'or') {
        return filter.conditions.some(f => evalF(f));
      }
    }
    return;
  };
  // console.log(evalF(filterGroup))
  return evalF(filterGroup);
};
