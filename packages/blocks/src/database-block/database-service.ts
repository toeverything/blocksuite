import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BaseBlockModel, type Page } from '@blocksuite/store';

import { getService } from '../__internal__/service/index.js';
import { BaseService } from '../__internal__/service/service.js';
import type { BlockModels } from '../__internal__/utils/model.js';
import type { SerializedBlock } from '../__internal__/utils/types.js';
import type { DataViewDataType, DataViewTypes } from './common/data-view.js';
import { DatabaseSelection } from './common/selection.js';
import type { DatabaseBlockModel } from './database-model.js';
import type { Column } from './table/types.js';
import type { Cell } from './types.js';

export class LegacyDatabaseBlockService extends BaseService<DatabaseBlockModel> {
  initDatabaseBlock(
    page: Page,
    model: BaseBlockModel,
    databaseId: string,
    viewType: DataViewTypes,
    isAppendNewRow = true
  ) {
    const blockModel = page.getBlockById(databaseId) as DatabaseBlockModel;
    assertExists(blockModel);
    blockModel.initTemplate(viewType);
    if (isAppendNewRow) {
      // Add a paragraph after database
      const parent = page.getParent(model);
      assertExists(parent);
      page.addBlock('affine:paragraph', {}, parent.id);
    }
    blockModel.applyColumnUpdate();
  }

  override block2Json(block: BlockModels['affine:database']): SerializedBlock {
    const columns = [...block.columns];
    const rowIds = block.children.map(child => child.id);

    const children = block.children?.map(child => {
      return getService(child.flavour).block2Json(child);
    });

    return {
      flavour: block.flavour,
      databaseProps: {
        id: block.id,
        title: block.title.toString(),
        rowIds,
        cells: block.cells,
        columns,
        views: block.views,
      },
      children,
    };
  }

  override async onBlockPasted(
    model: BlockModels['affine:database'],
    props: {
      rowIds: string[];
      columns: Column[];
      cells: Record<string, Record<string, Cell>>;
      views: DataViewDataType[];
    }
  ) {
    const { rowIds, columns, cells, views } = props;
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

    views.forEach(view => {
      model.addView(view.mode);
    });
  }
}

export class DatabaseService extends BlockService<DatabaseBlockModel> {
  override mounted(): void {
    super.mounted();
    this.selectionManager.register(DatabaseSelection);

    this.handleEvent('selectionChange', () => true);
  }
}
