import type { VariableOrProperty } from '../expression/types.js';

export type SortBy = {
  ref: VariableOrProperty;
  desc: boolean;
};
export type Sort = {
  sortBy: SortBy[];
  manuallySort: string[];
};
