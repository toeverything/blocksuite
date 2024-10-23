import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type {
  Variable,
  VariableOrProperty,
  VariableRef,
} from '../expression/types.js';
import type { FilterGroup, SingleFilter } from './types.js';

import { getRefType } from '../expression/ref/ref.js';
import { filterMatcher } from './matcher/matcher.js';

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
