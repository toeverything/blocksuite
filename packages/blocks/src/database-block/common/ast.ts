import { filterMatcher } from '../logical/filter-matcher.js';
import { propertyMatcher } from '../logical/property-matcher.js';
import type { TType } from '../logical/typesystem.js';

export type Variable = { name: string; type: TType; id: string };
export type FilterGroup = {
  type: 'group';
  op: 'and' | 'or';
  conditions: Filter[];
};
export type VariableRef = {
  type: 'ref';
  name: string;
};

export type Property = {
  type: 'property';
  ref: VariableRef;
  propertyFuncName: string;
};

export type VariableOrProperty = VariableRef | Property;

export type Literal = {
  type: 'literal';
  value: unknown;
};
export type Value = VariableRef | Literal;
export type SingleFilter = {
  type: 'filter';
  left: VariableOrProperty;
  function?: string;
  args: Value[];
};
export type Filter = SingleFilter | FilterGroup;
export type SortExp = {
  left: VariableOrProperty;
  type: 'asc' | 'desc';
};

export type SortGroup = SortExp[];

export type GroupExp = {
  left: VariableOrProperty;
  type: 'asc' | 'desc';
};

export type GroupList = GroupExp[];
export const getRefType = (vars: Variable[], ref: VariableOrProperty) => {
  if (ref.type === 'ref') {
    return vars.find(v => v.id === ref.name)?.type;
  }
  return propertyMatcher.find(v => v.data.name === ref.propertyFuncName)?.type
    .rt;
};
export const firstFilterName = (vars: Variable[], ref: VariableOrProperty) => {
  const type = getRefType(vars, ref);
  if (!type) {
    throw new Error(`can't resolve ref type`);
  }
  return filterMatcher.match(type)?.name;
};

export const firstFilter = (vars: Variable[]): SingleFilter => {
  const ref: VariableRef = {
    type: 'ref',
    name: vars[0].id,
  };
  const filter = firstFilterName(vars, ref);
  if (!filter) {
    throw new Error(`can't match any filter`);
  }
  return {
    type: 'filter',
    left: ref,
    function: filter,
    args: [],
  };
};

export const firstFilterInGroup = (vars: Variable[]): FilterGroup => {
  return {
    type: 'group',
    op: 'and',
    conditions: [firstFilter(vars)],
  };
};

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
    return fn!.impl(value);
  } catch (e) {
    console.error(e);
    return;
  }
};

const evalValue = (value: Value, row: Record<string, unknown>): unknown => {
  return value;
  //TODO
  // switch (value.type) {
  //     case "ref":
  //         return evalRef(value, row)
  //     case "literal":
  //         return value.value;
  // }
};
export const evalFilter = (
  filterGroup: FilterGroup,
  row: Record<string, unknown>
) => {
  const evalF = (filter: Filter): unknown => {
    if (filter.type === 'filter') {
      const value = evalRef(filter.left, row);
      const func = filterMatcher.findData(v => v.name === filter.function);
      const args = filter.args.map(value => evalValue(value, row));
      // console.log(toRaw(filter), toRaw(value), toRaw(func), args)
      try {
        const impl = func!.impl(value, ...args);
        // console.log(impl)
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
