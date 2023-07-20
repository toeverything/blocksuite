import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Slot,
} from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import { asyncFocusRichText } from '../__internal__/utils/common-operations.js';
import type {
  DatabaseSelection,
  DatabaseSelectionState,
  SerializedBlock,
} from '../__internal__/utils/types.js';
import { multiSelectHelper } from './common/columns/define.js';
import type { DatabaseBlockModel } from './database-model.js';
import type { Cell, Column } from './table/types.js';

export class DatabaseBlockService extends BaseService<DatabaseBlockModel> {
  private _databaseSelection?: DatabaseSelection;

  slots = {
    databaseSelectionUpdated: new Slot<{
      selection: DatabaseSelectionState;
      old: DatabaseSelectionState;
    }>(),
  };

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
    model.deleteColumn(model.id);
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

  selectionEqual(a: DatabaseSelectionState, b: DatabaseSelectionState) {
    if (a === undefined || b === undefined) return a === b;
    if (a.databaseId !== b.databaseId) return false;
    if (
      a.rowsSelection?.start !== b.rowsSelection?.start ||
      a.rowsSelection?.end !== b.rowsSelection?.end
    )
      return false;
    if (
      a.columnsSelection?.start !== b.columnsSelection?.start ||
      a.columnsSelection?.end !== b.columnsSelection?.end
    )
      return false;
    if (
      a.focus.rowIndex !== b.focus.rowIndex ||
      a.focus.columnIndex !== b.focus.columnIndex
    )
      return false;
    return a.isEditing === b.isEditing;
  }

  select(state: DatabaseSelectionState) {
    const old = this._databaseSelection;
    if (this.selectionEqual(state, old)) {
      return;
    }
    this._databaseSelection = state;
    this.slots.databaseSelectionUpdated.emit({
      selection: state,
      old,
    });
  }

  getSelection() {
    return this._databaseSelection;
  }
}
