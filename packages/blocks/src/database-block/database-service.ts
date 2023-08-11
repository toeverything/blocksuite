import { BlockService } from '@blocksuite/block-std';
import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  type BaseBlockModel,
  nanoid,
  type Page,
} from '@blocksuite/store';

import { getService } from '../__internal__/service/index.js';
import { BaseService } from '../__internal__/service/service.js';
import type { SerializedBlock } from '../__internal__/utils/types.js';
import { getTagColor } from '../components/tags/colors.js';
import { selectPureColumnConfig } from './common/columns/select/define.js';
import { titlePureColumnConfig } from './common/columns/title/define.js';
import type { DataViewTypes } from './common/data-view.js';
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
    // default column
    const ids = [nanoid(), nanoid(), nanoid()];
    const statusId = blockModel.addColumn(
      'end',
      selectPureColumnConfig.create('Status', {
        options: [
          {
            id: ids[0],
            color: getTagColor(),
            value: 'TODO',
          },
          {
            id: ids[1],
            color: getTagColor(),
            value: 'In Progress',
          },
          {
            id: ids[2],
            color: getTagColor(),
            value: 'Done',
          },
        ],
      })
    );
    blockModel.addColumn(
      'start',
      titlePureColumnConfig.create(titlePureColumnConfig.name)
    );
    blockModel.addView(viewType);
    // By default, database has 3 empty rows
    for (let i = 0; i < 4; i++) {
      const rowId = page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text(`Task ${i + 1}`),
        },
        databaseId
      );
      blockModel.updateCell(rowId, {
        columnId: statusId,
        value: ids[i],
      });
    }
    if (isAppendNewRow) {
      // Add a paragraph after database
      const parent = page.getParent(model);
      assertExists(parent);
      page.addBlock('affine:paragraph', {}, parent.id);
    }
    blockModel.applyColumnUpdate();
  }

  override block2Json(
    block: BlockModels['affine:database'],
    selectedModels?: Map<string, number>,
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
      children: block.children
        ?.filter(child => selectedModels?.has(child.id) ?? true)
        .map((child, index, array) => {
          if (index === array.length - 1) {
            return getService(child.flavour).block2Json(
              child,
              selectedModels,
              0,
              end
            );
          }
          return getService(child.flavour).block2Json(child, selectedModels);
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
}

export class DatabaseService extends BlockService<DatabaseBlockModel> {
  override mounted(): void {
    super.mounted();
    this.selectionManager.register(DatabaseSelection);

    this.handleEvent('selectionChange', () => true);
  }
}
