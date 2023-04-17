import type { Column } from '@blocksuite/global/database';
import type { Cell } from '@blocksuite/global/database';
import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import type { SerializedBlock } from '../std.js';
import type { DatabaseBlockModel } from './database-model.js';

export class DatabaseBlockService extends BaseService<DatabaseBlockModel> {
  initDatabaseBlock(
    page: Page,
    model: BaseBlockModel,
    databaseId: string,
    isAppendNewRow = true
  ) {
    // By default, database has 3 empty rows
    for (let i = 0; i < 3; i++) {
      page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text(''),
        },
        databaseId
      );
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
        let value = cellData?.value;
        if (!value) return;
        if (value instanceof model.page.YText) {
          value = value.clone();
        }
        model.updateCell(newRowId, {
          columnId: newColumnIds[columnIndex],
          value,
        });
      });
    });
  }
}
