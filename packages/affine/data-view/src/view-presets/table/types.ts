import { assertExists } from '@blocksuite/global/utils';

export type ColumnType = string;

export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: ColumnType;
  name: string;
  data: Data;
}

export type StatCalcOpType = string | undefined;

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
