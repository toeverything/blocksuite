import type { VariableOrProperty } from './ast.js';

export type GroupBy = {
  type: 'groupBy';
  columnId: string;
  name: string;
  sort?: {
    desc: boolean;
  };
};
export type GroupProperty = {
  key: string;
  hide?: boolean;
  manuallyCardSort: string[];
};
export type SortBy = {
  ref: VariableOrProperty;
  desc: boolean;
};
export type Sort = {
  sortBy: SortBy[];
  manuallySort: string[];
};
