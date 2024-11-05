import type { Value, VariableRef } from '../expression/types.js';

export type SingleFilter = {
  type: 'filter';
  left: VariableRef;
  function?: string;
  args: Value[];
};
export type FilterGroup = {
  type: 'group';
  op: 'and' | 'or';
  conditions: Filter[];
};
export type Filter = SingleFilter | FilterGroup;
