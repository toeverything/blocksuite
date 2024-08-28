import { assertExists } from '@blocksuite/global/utils';

// Common formula types
export type StatCalcOpBaseTypes =
  | 'none'
  | 'count-all'
  | 'count-values'
  | 'count-uni-values'
  | 'count-empty'
  | 'count-not-empty'
  | 'percent-empty'
  | 'percent-not-empty';

// Mathematical formula types
export type StatCalcOpMathTypes =
  | StatCalcOpBaseTypes
  | 'sum'
  | 'avg'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'range';

export type StatCalcOpCheckboxTypes =
  | StatCalcOpBaseTypes
  | 'checked'
  | 'not-checked'
  | 'percent-checked'
  | 'percent-not-checked';

// Union of all formula types
export type StatCalcOpType =
  | StatCalcOpBaseTypes
  | StatCalcOpMathTypes
  | StatCalcOpCheckboxTypes;

export const getTableContainer = (ele: HTMLElement) => {
  const element = ele.closest(
    '.affine-database-table-container'
  ) as HTMLElement;
  assertExists(element);
  return element;
};
type WithTableViewType<T> = T extends unknown
  ? {
      viewId: string;
      type: 'table';
    } & T
  : never;
export type RowWithGroup = {
  id: string;
  groupKey?: string;
};
export const RowWithGroup = {
  equal(a?: RowWithGroup, b?: RowWithGroup) {
    if (a == null || b == null) {
      return false;
    }
    return a.id === b.id && a.groupKey === b.groupKey;
  },
};
export type TableRowSelection = {
  selectionType: 'row';
  rows: RowWithGroup[];
};
export const TableRowSelection = {
  rows: (selection?: TableViewSelection): RowWithGroup[] => {
    if (selection?.selectionType === 'row') {
      return selection.rows;
    }
    return [];
  },
  rowsIds: (selection?: TableViewSelection): string[] => {
    return TableRowSelection.rows(selection).map(v => v.id);
  },
  includes(
    selection: TableViewSelection | undefined,
    row: RowWithGroup
  ): boolean {
    if (!selection) {
      return false;
    }
    return TableRowSelection.rows(selection).some(v =>
      RowWithGroup.equal(v, row)
    );
  },
  create(options: { rows: RowWithGroup[] }): TableRowSelection {
    return {
      selectionType: 'row',
      rows: options.rows,
    };
  },
  is(selection?: TableViewSelection): selection is TableRowSelection {
    return selection?.selectionType === 'row';
  },
};
export type TableAreaSelection = {
  selectionType: 'area';
  groupKey?: string;
  rowsSelection: MultiSelection;
  columnsSelection: MultiSelection;
  focus: CellFocus;
  isEditing: boolean;
};
export const TableAreaSelection = {
  create: (options: {
    groupKey?: string;
    focus: CellFocus;
    rowsSelection?: MultiSelection;
    columnsSelection?: MultiSelection;
    isEditing: boolean;
  }): TableAreaSelection => {
    return {
      ...options,
      selectionType: 'area',
      rowsSelection: options.rowsSelection ?? {
        start: options.focus.rowIndex,
        end: options.focus.rowIndex,
      },
      columnsSelection: options.columnsSelection ?? {
        start: options.focus.columnIndex,
        end: options.focus.columnIndex,
      },
    };
  },
  isFocus(selection: TableAreaSelection) {
    return (
      selection.focus.rowIndex === selection.rowsSelection.start &&
      selection.focus.rowIndex === selection.rowsSelection.end &&
      selection.focus.columnIndex === selection.columnsSelection.start &&
      selection.focus.columnIndex === selection.columnsSelection.end
    );
  },
};

export type CellFocus = {
  rowIndex: number;
  columnIndex: number;
};
export type MultiSelection = {
  start: number;
  end: number;
};
export type TableViewSelection = TableAreaSelection | TableRowSelection;
export type TableViewSelectionWithType = WithTableViewType<
  TableAreaSelection | TableRowSelection
>;
