import type { ColumnSchema } from '@blocksuite/global/database';
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

    // default column
    const tagColumnId = page.db.updateColumnSchema({
      name: 'Tag',
      type: 'multi-select',
      width: 200,
      hide: false,
      selection: [],
    });
    const blockModel = page.getBlockById(databaseId);
    assertExists(blockModel);
    page.updateBlock(blockModel, {
      columns: [tagColumnId],
    });
  }

  override block2Json(
    block: BlockModels['affine:database'],
    begin?: number,
    end?: number
  ): SerializedBlock {
    const columnSchemaIds = block.columns as string[];
    const columnIds = block.children.map(child => child.id);

    return {
      flavour: block.flavour,
      databaseProps: {
        id: block.id,
        title: block.title.toString(),
        titleColumn: block.titleColumn,
        columnIds,
        columnSchemaIds,
      },
      children: block.children?.map((child, index) => {
        if (index === block.children.length - 1) {
          return getService(child.flavour).block2Json(child, 0, end);
        }
        return getService(child.flavour).block2Json(child);
      }),
    };
  }

  async onBlockPasted(
    model: BlockModels['affine:database'],
    props: Record<string, string[]>
  ) {
    const { columnIds, columnSchemaIds } = props;

    // add ext:columnSchema
    const columnSchemas = columnSchemaIds
      .map(id => model.page.getColumnSchema(id))
      .filter((s: ColumnSchema | null): s is ColumnSchema => s !== null);
    const newColumnSchemaIds = columnSchemas.map(schema => {
      const { id, ...nonIdProps } = schema;
      return model.page.updateColumnSchema(nonIdProps);
    });
    model.page.updateBlock(model, {
      columns: newColumnSchemaIds,
    });

    // add ext:columns
    const newColumnIds = model.children.map(child => child.id);
    columnIds.forEach((columnId, columnIndex) => {
      const newColumnId = newColumnIds[columnIndex];
      columnSchemaIds.forEach((columnSchemaId, columnSchemaIndex) => {
        const cellData = model.page.getColumn(columnId, columnSchemaId);
        let value = cellData?.value;
        if (!value) return;
        if (value instanceof model.page.YText) {
          value = value.clone();
        }
        model.page.updateColumn(newColumnId, {
          columnId: newColumnSchemaIds[columnSchemaIndex],
          value,
        });
      });
    });
  }
}
