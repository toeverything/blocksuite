import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';

import { InlineManager } from '../_common/inline/inline-manager.js';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
} from '../_common/inline/presets/affine-inline-specs.js';
import { affineInlineMarkdownMatches } from '../_common/inline/presets/markdown.js';
import { ReferenceNodeConfig } from '../_common/inline/presets/nodes/reference-node/reference-config.js';
import type { DataViewTypes } from './data-view/common/data-view.js';
import { DatabaseSelection } from './data-view/common/selection.js';
import type { DatabaseBlockModel } from './database-model.js';

export class DatabaseService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<DatabaseBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();
  readonly referenceNodeConfig = new ReferenceNodeConfig();

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

  initDatabaseBlock(
    doc: Doc,
    model: BlockModel,
    databaseId: string,
    viewType: DataViewTypes,
    isAppendNewRow = true
  ) {
    const blockModel = doc.getBlockById(databaseId) as DatabaseBlockModel;
    assertExists(blockModel);
    blockModel.initTemplate(viewType);
    if (isAppendNewRow) {
      // Add a paragraph after database
      const parent = doc.getParent(model);
      assertExists(parent);
      doc.addBlock('affine:paragraph', {}, parent.id);
    }
    blockModel.applyColumnUpdate();
  }
}
