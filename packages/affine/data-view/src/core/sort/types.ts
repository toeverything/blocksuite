import type { VariableRef } from '../expression/types.js';

export type SortBy = {
  ref: VariableRef;
  desc: boolean;
};
export type Sort = {
  sortBy: SortBy[];
  manuallySort: string[];
};
