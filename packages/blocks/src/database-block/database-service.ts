import type { BlockModel, Doc } from '@blocksuite/store';

import {
  affineInlineMarkdownMatches,
  getAffineInlineSpecsWithReference,
  InlineManager,
  ReferenceNodeConfig,
} from '@blocksuite/affine-components/rich-text';
import {
  type DatabaseBlockModel,
  DatabaseBlockSchema,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';
import { DatabaseSelection, type ViewMeta } from '@blocksuite/data-view';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import { assertExists } from '@blocksuite/global/utils';

import {
  addColumn,
  applyColumnUpdate,
  databaseViewAddView,
  databaseViewInitEmpty,
  databaseViewInitTemplate,
  updateCell,
  updateView,
} from './utils.js';

export class DatabaseBlockService extends BlockService {
  static override readonly flavour = DatabaseBlockSchema.model.flavour;

  addColumn = addColumn;

  applyColumnUpdate = applyColumnUpdate;

  databaseViewAddView = databaseViewAddView;

  databaseViewInitEmpty = databaseViewInitEmpty;

  readonly inlineManager = new InlineManager();

  readonly referenceNodeConfig = new ReferenceNodeConfig();

  updateCell = updateCell;

  updateView = updateView;

  viewPresets = viewPresets;

  initDatabaseBlock(
    doc: Doc,
    model: BlockModel,
    databaseId: string,
    viewMeta: ViewMeta,
    isAppendNewRow = true
  ) {
    const blockModel = doc.getBlockById(databaseId) as DatabaseBlockModel;
    assertExists(blockModel);
    databaseViewInitTemplate(blockModel, viewMeta);
    if (isAppendNewRow) {
      // Add a paragraph after database
      const parent = doc.getParent(model);
      assertExists(parent);
      doc.addBlock('affine:paragraph', {}, parent.id);
    }
    applyColumnUpdate(blockModel);
  }

  override mounted(): void {
    super.mounted();
    this.selectionManager.register(DatabaseSelection);

    this.referenceNodeConfig.setDoc(this.doc);

    const inlineSpecs = getAffineInlineSpecsWithReference(
      this.referenceNodeConfig
    );
    this.inlineManager.registerSpecs(inlineSpecs);
    this.inlineManager.registerMarkdownMatches(affineInlineMarkdownMatches);
  }
}
