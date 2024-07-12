import type { TemplateResult } from 'lit';

import { assertExists } from '@blocksuite/global/utils';

export type ColumnType = string;

export type ColumnTypeIcon = Record<ColumnType, TemplateResult>;

export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  data: Data;
  id: string;
  name: string;
  type: ColumnType;
}
// Common formula types
export type StatCalcOpBaseTypes =
  | 'count-all'
  | 'count-empty'
  | 'count-not-empty'
  | 'count-uni-values'
  | 'count-values'
  | 'none'
  | 'percent-empty'
  | 'percent-not-empty';

// Mathematical formula types
export type StatCalcOpMathTypes =
  | 'avg'
  | 'max'
  | 'median'
  | 'min'
  | 'mode'
  | 'range'
  | 'sum'
  | StatCalcOpBaseTypes;

export type StatCalcOpCheckboxTypes =
  | 'checked'
  | 'not-checked'
  | 'percent-checked'
  | 'percent-not-checked'
  | StatCalcOpBaseTypes;

// Union of all formula types
export type StatCalcOpType =
  | StatCalcOpBaseTypes
  | StatCalcOpCheckboxTypes
  | StatCalcOpMathTypes;

export const getTableContainer = (ele: HTMLElement) => {
  const element = ele.closest(
    '.affine-database-table-container'
  ) as HTMLElement;
  assertExists(element);
  return element;
};
export type CellFocus = {
  columnIndex: number;
  rowIndex: number;
};
export type MultiSelection = {
  end: number;
  start: number;
};
export type TableViewSelection = {
  columnsSelection?: MultiSelection;
  focus: CellFocus;
  groupKey?: string;
  isEditing: boolean;
  rowsSelection?: MultiSelection;
  type: 'table';
  viewId: string;
};
