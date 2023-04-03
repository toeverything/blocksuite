import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
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
}
