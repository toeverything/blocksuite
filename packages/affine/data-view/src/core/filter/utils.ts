import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import { getRefType } from '../expression/ref/ref.js';
import type { Variable, VariableRef } from '../expression/types.js';
import { filterMatcher } from './filter-fn/matcher.js';
import type { FilterGroup, SingleFilter } from './types.js';

export const firstFilterName = (vars: Variable[], ref: VariableRef) => {
  const type = getRefType(vars, ref);
  if (!type) {
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      `can't resolve ref type`
    );
  }
  return filterMatcher.firstMatchedBySelfType(type)?.name;
};
export const firstFilterByRef = (
  vars: Variable[],
  ref: VariableRef
): SingleFilter => {
  return {
    type: 'filter',
    left: ref,
    function: firstFilterName(vars, ref),
    args: [],
  };
};
export const firstFilter = (vars: Variable[]): SingleFilter => {
  const variable = vars[0];
  if (!variable) {
    throw new BlockSuiteError(
      ErrorCode.DatabaseBlockError,
      `can't find any variable`
    );
  }
  const ref: VariableRef = {
    type: 'ref',
    name: variable.id,
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
