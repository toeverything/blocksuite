import type { VariableOrProperty } from './ast.js';

export type GroupBy = {
  columnId: string;
  name: string;
  sort?: {
    desc: boolean;
  };
  type: 'groupBy';
};
export type GroupProperty = {
  hide?: boolean;
  key: string;
  manuallyCardSort: string[];
};
export type SortBy = {
  desc: boolean;
  ref: VariableOrProperty;
};
export type Sort = {
  manuallySort: string[];
  sortBy: SortBy[];
};
