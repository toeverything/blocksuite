import type { ColumnSchema } from '@blocksuite/global/database';
import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import type { OpenBlockInfo } from '../std.js';
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
    const tagColumnId = page.setColumnSchema({
      internalProperty: {
        color: '#ff0000',
        width: 200,
        hide: false,
      },
      property: {
        selection: [],
      },
      name: 'Tag',
      type: 'multi-select',
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
  ): OpenBlockInfo {
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
          // @ts-ignore
          return getService(child.flavour).block2Json(child, 0, end);
        }
        // @ts-ignore
        return getService(child.flavour).block2Json(child);
      }),
    };
  }

  async onBlockPasted(
    model: BlockModels['affine:database'],
    props: Record<string, string[]>
  ) {
    // wait for the database's children to be added
    setTimeout(() => {
      const { columnIds, columnSchemaIds } = props;

      // add ext:columnSchema
      const columnSchemas = columnSchemaIds
        .map(id => model.page.getColumnSchema(id))
        .filter((s: ColumnSchema | null): s is ColumnSchema => s !== null);
      const newColumnSchemaIds = columnSchemas.map(schema => {
        const { id, ...nonIdProps } = schema;
        return model.page.setColumnSchema(nonIdProps);
      });
      model.page.updateBlock(model, {
        columns: newColumnSchemaIds,
      });

      // add ext:columns
      const newColumnIds = model.children.map(child => child.id);
      const columnIdMap = columnIds.reduce((prev, oldColumnId, index) => {
        return {
          ...prev,
          [oldColumnId]: newColumnIds[index],
        };
      }, {} as Record<string, string>);
      const columnSchemaIdMap = columnSchemaIds.reduce(
        (prev, oldColumnSchemaId, index) => {
          return {
            ...prev,
            [oldColumnSchemaId]: newColumnSchemaIds[index],
          };
        },
        {} as Record<string, string>
      );
      model.page.copyBlockColumns(columnIdMap, columnSchemaIdMap);
    });
  }
}
