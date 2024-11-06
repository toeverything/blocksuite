import type { UIEventStateContext } from '@blocksuite/block-std';
import type { ReactiveController } from 'lit';

import { toast } from '@blocksuite/affine-components/toast';
import { Slice } from '@blocksuite/store';

import type { Cell } from '../../../core/view-manager/cell.js';
import type { Row } from '../../../core/view-manager/row.js';
import type { MicrosheetCellContainer } from '../cell.js';
import type { DataViewTable } from '../table-view.js';

import {
  TableAreaSelection,
  TableRowSelection,
  type TableViewSelection,
  type TableViewSelectionWithType,
} from '../types.js';

const BLOCKSUITE_MICROSHEET_TABLE = 'blocksuite/microsheet';
const TEXT = 'text/plain';

export class TableClipboardController implements ReactiveController {
  private _onCopy = async (
    tableSelection: TableViewSelectionWithType,
    isCut = false
  ) => {
    const table = this.host;

    const area = getSelectedAreaValues(tableSelection, table);
    if (!area) {
      return;
    }

    const promiseArr: Promise<void>[] = [];
    area.forEach(row => {
      row.forEach(cell => {
        promiseArr.push(
          (async () => {
            const cellContainerModel = this.std.doc.getBlockById(
              cell.ref as string
            );
            if (cellContainerModel) {
              const slice = Slice.fromModels(
                this.std.doc,
                cellContainerModel.children
              );
              const item = await this.std.clipboard._getClipboardItem(
                slice,
                'BLOCKSUITE/SNAPSHOT'
              );
              cell['cellContainerSlice'] = item;
              if (isCut) {
                const children = cellContainerModel.children;
                children.forEach(b => this.std.doc.deleteBlock(b));
                this.std.doc.addBlock(
                  'affine:paragraph',
                  {},
                  cellContainerModel.id
                );
              }
            }
          })()
        );
      });
    });
    await Promise.all(promiseArr);
    this.std.clipboard
      .writeToClipboard(items => {
        return {
          ...items,
          [TEXT]: 'microsheet-copy-block',
          [BLOCKSUITE_MICROSHEET_TABLE]: JSON.stringify(area),
        };
      })
      .then(() => {
        const count = area.flatMap(row => row).length;
        toast(
          this.std.host,
          `${count} cell${count > 1 ? 's' : ''} copied to clipboard`
        );
      })
      .catch(console.error);

    return true;
  };

  private _onCut = (tableSelection: TableViewSelectionWithType) => {
    this._onCopy(tableSelection, true)
      .then()
      .catch(() => {});
  };

  private _onPaste = async (_context: UIEventStateContext) => {
    const event = _context.get('clipboardState').raw;
    event.stopPropagation();
    const view = this.host;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const tableSelection = this.host.selectionController.selection;
    if (TableRowSelection.is(tableSelection)) {
      return;
    }
    if (tableSelection) {
      const json = await this.std.clipboard.readFromClipboard(clipboardData);
      const copiedValues = json[BLOCKSUITE_MICROSHEET_TABLE];
      if (!copiedValues) return;
      const jsonAreaData = JSON.parse(copiedValues) as CopyedSelectionData;
      this.pasteToCells(view, jsonAreaData, tableSelection);
    } else if (this.host.selectionController.focus) {
      const json = await this.std.clipboard.readFromClipboard(clipboardData);
      const copiedValues = json[BLOCKSUITE_MICROSHEET_TABLE];
      if (!copiedValues) return;
      const copyedSelectionData = JSON.parse(
        copiedValues
      ) as CopyedSelectionData;
      const rowStartIndex = this.host.selectionController.focus.rowIndex;
      const columnStartIndex = this.host.selectionController.focus.columnIndex;
      const rowLength = copyedSelectionData.length;
      const columnLength = copyedSelectionData[0].length;
      const tableAreaSelection = TableAreaSelection.create({
        focus: {
          rowIndex: rowStartIndex,
          columnIndex: columnStartIndex,
        },
        rowsSelection: {
          start: rowStartIndex,
          end: rowStartIndex + rowLength - 1,
        },
        columnsSelection: {
          start: columnStartIndex,
          end: columnStartIndex + columnLength - 1,
        },
        isEditing: false,
      });
      this.pasteToCells(view, copyedSelectionData, tableAreaSelection);
    }

    return true;
  };

  get props() {
    return this.host.props;
  }

  private get readonly() {
    return this.props.view.readonly$.value;
  }

  private get std() {
    return this.props.std;
  }

  constructor(public host: DataViewTable) {
    host.addController(this);
  }

  private pasteToCells(
    table: DataViewTable,
    copied: CopyedSelectionData,
    tableAreaSelection: TableAreaSelection
  ) {
    const { view } = table.props;
    for (
      let i = 0;
      i <=
      tableAreaSelection.rowsSelection.end -
        tableAreaSelection.rowsSelection.start;
      i++
    ) {
      for (
        let j = 0;
        j <=
        tableAreaSelection.columnsSelection.end -
          tableAreaSelection.columnsSelection.start;
        j++
      ) {
        const copyCell = copied?.[i]?.[j];
        if (!copyCell) continue;
        const targetContainer = table.selectionController.getCellContainer(
          tableAreaSelection.groupKey,
          i + tableAreaSelection.rowsSelection.start,
          j + tableAreaSelection.columnsSelection.start
        );
        const rowId = targetContainer?.dataset.rowId;
        const columnId = targetContainer?.dataset.columnId;
        if (rowId && columnId) {
          const { cellContainerSlice } = copyCell;
          const targetCellContainerId = view.cellRefGet(
            rowId,
            columnId
          ) as string;
          if (targetCellContainerId) {
            const cellContainerBlock = this.std.doc.getBlockById(
              targetCellContainerId
            );
            if (cellContainerBlock) {
              const children = cellContainerBlock.children;
              children.forEach(b => {
                this.std.doc.deleteBlock(b);
              });
            }
            (async () => {
              await this.std.clipboard.pasteCellSliceSnapshot(
                JSON.parse(cellContainerSlice as string)?.snapshot,
                this.std.doc,
                targetCellContainerId
              );
            })()
              .then()
              .catch(() => {});
          }
        }
      }
    }
  }

  copy() {
    const tableSelection = this.host.selectionController.selection;
    if (!tableSelection) {
      return;
    }
    this._onCopy(tableSelection).catch(console.error);
  }

  cut() {
    const tableSelection = this.host.selectionController.selection;
    if (!tableSelection) {
      return;
    }
    this._onCopy(tableSelection, true).catch(err => console.log(err));
  }

  hostConnected() {
    this.host.disposables.add(
      this.props.handleEvent('copy', _ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCopy(tableSelection).catch(console.error);
        return true;
      })
    );

    this.host.disposables.add(
      this.props.handleEvent('cut', _ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCut(tableSelection);
      })
    );

    this.host.disposables.add(
      this.props.handleEvent('paste', ctx => {
        if (this.readonly) return false;

        this._onPaste(ctx).catch(console.error);
        return true;
      })
    );
  }
}
function getSelectedAreaValues(
  selection: TableViewSelection,
  table: DataViewTable
): { ref: string; cellContainerSlice: string }[][] {
  const view = table.props.view;
  const rsl: { ref: string; cellContainerSlice: string }[][] = [];
  const values = getSelectedArea(selection, table);
  values?.forEach((row, index) => {
    const cells = row.cells;
    if (!rsl[index]) {
      rsl[index] = [];
    }
    cells.forEach(cell => {
      rsl[index].push({
        ref: view.cellRefGet(cell.rowId, cell.propertyId) as string,
      });
    });
  });
  return rsl;
}
function getSelectedArea(
  selection: TableViewSelection,
  table: DataViewTable
): SelectedArea | undefined {
  const view = table.props.view;
  if (TableRowSelection.is(selection)) {
    const rows = TableRowSelection.rows(selection)
      .map(row => {
        const y =
          table.selectionController
            .getRow(row.groupKey, row.id)
            ?.getBoundingClientRect().y ?? 0;
        return {
          y,
          row,
        };
      })
      .sort((a, b) => a.y - b.y)
      .map(v => v.row);
    return rows.map(r => {
      const row = view.rowGet(r.id);
      return {
        row,
        cells: row.cells$.value,
      };
    });
  }
  const { rowsSelection, columnsSelection, groupKey } = selection;
  const data: SelectedArea = [];
  const rows = groupKey
    ? view.groupManager.groupDataMap$.value?.[groupKey].rows
    : view.rows$.value;
  const columns = view.propertyIds$.value;
  if (!rows) {
    return;
  }
  for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
    const row: SelectedArea[number] = {
      cells: [],
    };
    const rowId = rows[i];
    for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
      const columnId = columns[j];
      const cell = view.cellGet(rowId, columnId);
      row.cells.push(cell);
    }
    data.push(row);
  }

  return data;
}

type SelectedArea = {
  row?: Row;
  cells: Cell[];
}[];

type CopyedColumn = {
  type: string;
  value: string;
  ref: unknown;
  cellContainerSlice?: unknown;
  container?: MicrosheetCellContainer;
};
type CopyedSelectionData = CopyedColumn[][];
