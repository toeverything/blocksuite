import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Slot,
} from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import {
  getClosestDatabaseId,
  getClosestRowId,
} from '../page-block/default/selection-manager/database-selection-manager/utils.js';
import type {
  DatabaseTableViewCellState,
  DatabaseTableViewRowState,
} from '../std.js';
import { asyncFocusRichText, type SerializedBlock } from '../std.js';
import type { DatabaseBlockModel } from './database-model.js';
import {
  clearAllDatabaseCellSelection,
  clearAllDatabaseRowsSelection,
  setDatabaseCellSelection,
  setDatabaseRowsSelection,
} from './table/components/selection/utils.js';
import type { Cell, Column } from './table/types.js';

type LastTableViewSelection = {
  databaseId: string;
  rowIds: string[];
};
export class DatabaseBlockService extends BaseService<DatabaseBlockModel> {
  private _lastSelection: LastTableViewSelection = {
    databaseId: '',
    rowIds: [],
  };

  slots = {
    tableViewRowSelectionUpdated: new Slot<DatabaseTableViewRowState>(),
    tableViewCellSelectionUpdated: new Slot<DatabaseTableViewCellState>(),
  };

  constructor() {
    super();

    this.slots.tableViewRowSelectionUpdated.on(state => {
      const { type, rowIds, databaseId } = state;

      if (type === 'select' || type === 'click') {
        if (!databaseId || !rowIds) return;
        this._lastSelection = {
          databaseId,
          rowIds,
        };
        setDatabaseRowsSelection(databaseId, rowIds);
      } else if (type === 'clear') {
        this.clearLastSelection();
        clearAllDatabaseRowsSelection();
      }
    });

    this.slots.tableViewCellSelectionUpdated.on(state => {
      const { type, databaseId, cell, key } = state;

      if (type === 'select') {
        if (!databaseId || !cell || !key) return;
        //  select
        setDatabaseCellSelection(databaseId, cell, key);
      } else if (type === 'clear') {
        // clear
        clearAllDatabaseCellSelection();
      }
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
    blockModel.updateColumn({
      name: 'Tag',
      type: 'multi-select',
      width: 200,
      hide: false,
      selection: [],
    });
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
      return model.updateColumn(nonIdProps);
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
    this.clearTableViewSelection();
    this.clearCellLevelSelection();
  }

  // row level selection
  clearTableViewSelection() {
    this.slots.tableViewRowSelectionUpdated.emit({
      type: 'clear',
    });
  }

  setTableViewSelection({
    type,
    databaseId,
    rowIds,
  }: DatabaseTableViewRowState) {
    if (type === 'click' && rowIds?.[0] === this._lastSelection.rowIds?.[0]) {
      this.clearTableViewSelection();
      return;
    }

    this.slots.tableViewRowSelectionUpdated.emit({
      type,
      databaseId,
      rowIds,
    });
  }

  setTableViewSelectionByElement(element: Element) {
    const rowId = getClosestRowId(element);
    if (rowId !== '') {
      const databaseId = getClosestDatabaseId(element);
      this.setTableViewSelection({
        type: 'select',
        databaseId,
        rowIds: [rowId],
      });
    }
  }

  clearLastSelection() {
    this._lastSelection = {
      databaseId: '',
      rowIds: [],
    };
  }

  refreshTableViewSelection() {
    const { databaseId, rowIds } = this._lastSelection;
    if (rowIds.length === 0) return;

    this.setTableViewSelection({
      type: 'select',
      databaseId,
      rowIds,
    });
  }

  toggleTableViewSelection(element: Element) {
    const rowId = getClosestRowId(element);
    if (rowId !== '') {
      const databaseId = getClosestDatabaseId(element);
      this.setTableViewSelection({
        type: 'click',
        databaseId,
        rowIds: [rowId],
      });
      return true;
    }
    return false;
  }

  // cell level selection
  clearCellLevelSelection() {
    this.slots.tableViewCellSelectionUpdated.emit({
      type: 'clear',
    });
  }
}
