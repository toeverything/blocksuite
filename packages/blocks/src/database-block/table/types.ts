import type { TemplateResult } from 'lit';

export type SetValueOption = {
  captureSync?: boolean;
};

export type ColumnType = string;

export type ColumnTypeIcon = Record<ColumnType, TemplateResult>;

export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  type: ColumnType;
  name: string;
  data: Data;
}

export type ColumnHeader = {
  type: ColumnType;
  text: string;
  icon: TemplateResult;
};

export const enum SearchState {
  /** show search input */
  SearchInput = 'input',
  /** show search icon */
  SearchIcon = 'icon',
  /** searching */
  Searching = 'searching',
  /** show more action */
  Action = 'action',
}
