import type { TType } from '../logical/typesystem.js';
import type { UniComponent } from '../utils/uni-component/uni-component.js';

import { propertyMatcher } from '../logical/property-matcher.js';
import { filterMatcher } from '../widget/filter/matcher/matcher.js';

export type Variable = {
  icon?: UniComponent;
  id: string;
  name: string;
  type: TType;
};
export type FilterGroup = {
  conditions: Filter[];
  op: 'and' | 'or';
  type: 'group';
};
export type VariableRef = {
  name: string;
  type: 'ref';
};

export type Property = {
  propertyFuncName: string;
  ref: VariableRef;
  type: 'property';
};

export type VariableOrProperty = Property | VariableRef;

export type Literal = {
  type: 'literal';
  value: unknown;
};
export type Value = /*VariableRef*/ Literal;
export type SingleFilter = {
  args: Value[];
  function?: string;
  left: VariableOrProperty;
  type: 'filter';
};
export type Filter = FilterGroup | SingleFilter;
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

export const firstFilterByRef = (
  vars: Variable[],
  ref: VariableOrProperty
): SingleFilter => {
  return {
    args: [],
    function: firstFilterName(vars, ref),
    left: ref,
    type: 'filter',
  };
};

export const firstFilter = (vars: Variable[]): SingleFilter => {
  const ref: VariableRef = {
    name: vars[0].id,
    type: 'ref',
  };
  const filter = firstFilterName(vars, ref);
  if (!filter) {
    throw new Error(`can't match any filter`);
  }
  return {
    args: [],
    function: filter,
    left: ref,
    type: 'filter',
  };
};

export const firstFilterInGroup = (vars: Variable[]): FilterGroup => {
  return {
    conditions: [firstFilter(vars)],
    op: 'and',
    type: 'group',
  };
};
