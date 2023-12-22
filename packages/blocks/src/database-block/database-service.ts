import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { DataViewTypes } from './common/data-view.js';
import { DatabaseSelection } from './common/selection.js';
import type { DatabaseBlockModel } from './database-model.js';

export class DatabaseService extends BlockService<DatabaseBlockModel> {
  override mounted(): void {
    super.mounted();
    this.selectionManager.register(DatabaseSelection);

    this.handleEvent('selectionChange', () => true);
  }

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
}
