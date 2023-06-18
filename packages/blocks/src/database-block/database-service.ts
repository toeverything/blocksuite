import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Slot,
} from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import type {
  DatabaseSelection,
  DatabaseTableViewCellState,
  DatabaseTableViewRowState,
} from '../std.js';
import { asyncFocusRichText, type SerializedBlock } from '../std.js';
import { multiSelectHelper } from './common/column-manager.js';
import type { DatabaseBlockModel } from './database-model.js';
import {
  clearAllDatabaseRowsSelection,
  setDatabaseRowsSelection,
} from './table/components/selection/utils.js';
import {
  getClosestDatabaseId,
  getClosestRowId,
} from './table/selection-manager/utils.js';
import type { Cell, Column } from './table/types.js';

type LastTableViewRowSelection = {
  databaseId: string;
  rowIds: string[];
};

export class DatabaseBlockService extends BaseService<DatabaseBlockModel> {
  private _lastRowSelection: LastTableViewRowSelection | null = null;
  private _databaseSelection?: DatabaseSelection;

  slots = {
    tableViewRowSelectionUpdated: new Slot<DatabaseTableViewRowState>(),
    databaseSelectionUpdated: new Slot<DatabaseTableViewCellState>(),
  };

  constructor() {
    super();

    this.slots.tableViewRowSelectionUpdated.on(state => {
      const { type } = state;

      if (type === 'select' || type === 'click') {
        const { rowIds, databaseId } = state;

        this._lastRowSelection = {
          databaseId,
          rowIds,
        };
        setDatabaseRowsSelection(databaseId, rowIds);
      } else if (type === 'clear') {
        this.clearLastRowSelection();
        clearAllDatabaseRowsSelection();
      }
    });

    this.slots.databaseSelectionUpdated.on(selection => {
      this._databaseSelection = selection;
    });
  }

  initDatabaseBlock(
    page: Page,
    model: BaseBlockModel,
    databaseId: string,
    isAppendNewRow = true
  ) {
    // By default, database has 3 empty rows
    for (let i = 0; i < 3; i++) {
      const id = page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text(''),
        },
        databaseId
      );
      if (i === 0) asyncFocusRichText(page, id);
    }
    if (isAppendNewRow) {
      // Add a paragraph after database
      const parent = page.getParent(model);
      assertExists(parent);
      page.addBlock('affine:paragraph', {}, parent.id);
    }

    const blockModel = page.getBlockById(databaseId) as DatabaseBlockModel;
    assertExists(blockModel);
    // default column
    blockModel.addColumn(
      'end',
      multiSelectHelper.create('Tag', {
        options: [],
      })
    );
    blockModel.applyColumnUpdate();
  }

  override block2Json(
    block: BlockModels['affine:database'],
    begin?: number,
    end?: number
  ): SerializedBlock {
    const columns = [...block.columns];
    const rowIds = block.children.map(child => child.id);

    return {
      flavour: block.flavour,
      databaseProps: {
        id: block.id,
        title: block.title.toString(),
        titleColumnName: block.titleColumnName,
        titleColumnWidth: block.titleColumnWidth,
        rowIds,
        cells: block.cells,
        columns,
      },
      children: block.children?.map((child, index) => {
        if (index === block.children.length - 1) {
          return getService(child.flavour).block2Json(child, 0, end);
        }
        return getService(child.flavour).block2Json(child);
      }),
    };
  }

  override async onBlockPasted(
    model: BlockModels['affine:database'],
    props: {
      rowIds: string[];
      columns: Column[];
      cells: Record<string, Record<string, Cell>>;
    }
  ) {
    const { rowIds, columns, cells } = props;

    const columnIds = columns.map(column => column.id);

    const newColumnIds = columns.map(schema => {
      const { id, ...nonIdProps } = schema;
      return model.addColumn('end', nonIdProps);
    });
    model.applyColumnUpdate();

    const newRowIds = model.children.map(child => child.id);
    rowIds.forEach((rowId, rowIndex) => {
      const newRowId = newRowIds[rowIndex];
      columnIds.forEach((columnId, columnIndex) => {
        const cellData = cells[rowId]?.[columnId];
        const value = cellData?.value;
        if (!value) return;
        model.updateCell(newRowId, {
          columnId: newColumnIds[columnIndex],
          value,
        });
      });
    });
  }

  clearSelection() {
    this.clearRowSelection();
    this.clearCellLevelSelection();
  }

  // row level selection
  clearRowSelection() {
    this.slots.tableViewRowSelectionUpdated.emit({
      type: 'clear',
    });
  }

  setRowSelection(state: DatabaseTableViewRowState) {
    if (
      state.type === 'click' &&
      this._lastRowSelection &&
      state.rowIds?.[0] === this._lastRowSelection.rowIds?.[0]
    ) {
      this.clearRowSelection();
      return;
    }

    this.slots.tableViewRowSelectionUpdated.emit(state);
  }

  setRowSelectionByElement(element: Element) {
    const rowId = getClosestRowId(element);
    if (rowId !== '') {
      const databaseId = getClosestDatabaseId(element);
      this.setRowSelection({
        type: 'select',
        databaseId,
        rowIds: [rowId],
      });
    }
  }

  clearLastRowSelection() {
    this._lastRowSelection = null;
  }

  refreshRowSelection() {
    if (!this._lastRowSelection) return;

    const { databaseId, rowIds } = this._lastRowSelection;

    this.setRowSelection({
      type: 'select',
      databaseId,
      rowIds,
    });
  }

  toggleRowSelection(element: Element) {
    const rowId = getClosestRowId(element);
    // click on database's drag handle
    if (rowId === '') return false;

    const rowIds = this._lastRowSelection?.rowIds ?? [];

    if (rowIds.indexOf(rowId) > -1) {
      this.clearRowSelection();
    } else {
      this.setRowSelection({
        type: 'click',
        databaseId: getClosestDatabaseId(element),
        rowIds: [rowId],
      });
    }
    return true;
  }

  getLastRowSelection() {
    return this._lastRowSelection;
  }

  // cell level selection
  clearCellLevelSelection() {
    this.slots.databaseSelectionUpdated.emit(undefined);
  }

  setCellSelection(cellSelectionState: DatabaseTableViewCellState) {
    this.slots.databaseSelectionUpdated.emit(cellSelectionState);
  }

  getLastCellSelection() {
    return this._databaseSelection;
  }
}
