import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { TType } from '../logical/typesystem.js';
import type { UniComponent } from '../utils/uni-component/uni-component.js';

import { filterMatcher } from '../../widget-presets/filter/matcher/matcher.js';
import { propertyMatcher } from '../logical/property-matcher.js';

export type Variable = {
  name: string;
  type: TType;
  id: string;
  icon?: UniComponent;
};
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
export type Value = /*VariableRef*/ Literal;
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
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      `can't resolve ref type`
    );
  }
  return filterMatcher.match(type)?.name;
};

export const firstFilterByRef = (
  vars: Variable[],
  ref: VariableOrProperty
): SingleFilter => {
  return {
    type: 'filter',
    left: ref,
    function: firstFilterName(vars, ref),
    args: [],
  };
};

export const firstFilter = (vars: Variable[]): SingleFilter => {
  const ref: VariableRef = {
    type: 'ref',
    name: vars[0].id,
  };
  const filter = firstFilterName(vars, ref);
  if (!filter) {
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      `can't match any filter`
    );
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
export const emptyFilterGroup: FilterGroup = {
  type: 'group',
  op: 'and',
  conditions: [],
};
