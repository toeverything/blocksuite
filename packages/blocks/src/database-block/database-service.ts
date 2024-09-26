import type { BlockModel, Doc } from '@blocksuite/store';

import {
  type DatabaseBlockModel,
  DatabaseBlockSchema,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';
import { viewPresets } from '@blocksuite/data-view/view-presets';

import {
  databaseViewAddView,
  databaseViewInitEmpty,
  databaseViewInitTemplate,
} from './data-source.js';
import {
  addProperty,
  applyPropertyUpdate,
  updateCell,
  updateView,
} from './utils.js';

export class DatabaseBlockService extends BlockService {
  static override readonly flavour = DatabaseBlockSchema.model.flavour;

  addColumn = addProperty;

  applyColumnUpdate = applyPropertyUpdate;

  databaseViewAddView = databaseViewAddView;

  databaseViewInitEmpty = databaseViewInitEmpty;

  updateCell = updateCell;

  updateView = updateView;

  viewPresets = viewPresets;

  initDatabaseBlock(
    doc: Doc,
    model: BlockModel,
    databaseId: string,
    viewType: string,
    isAppendNewRow = true
  ) {
    const blockModel = doc.getBlock(databaseId)?.model as
      | DatabaseBlockModel
      | undefined;
    if (!blockModel) {
      return;
    }
    databaseViewInitTemplate(blockModel, viewType);
    if (isAppendNewRow) {
      const parent = doc.getParent(model);
      if (!parent) return;
      doc.addBlock('affine:paragraph', {}, parent.id);
    }
    applyPropertyUpdate(blockModel);
  }
}
