import {
  InlineManager,
  ReferenceNodeConfig,
  affineInlineMarkdownMatches,
  getAffineInlineSpecsWithReference,
} from '@blocksuite/affine-components/rich-text';
import { BlockService } from '@blocksuite/block-std';

import type { DataViewBlockModel } from './data-view-model.js';

import { DatabaseSelection } from '../database-block/data-view/index.js';

export class DataViewBlockService extends BlockService<DataViewBlockModel> {
  readonly inlineManager = new InlineManager();

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
}
