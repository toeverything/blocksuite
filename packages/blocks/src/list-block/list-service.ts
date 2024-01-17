import { BlockService } from '@blocksuite/block-std';

import { InlineManager } from '../_common/inline/inline-manager.js';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
} from '../_common/inline/presets/affine-inline-specs.js';
import { affineInlineMarkdownMatches } from '../_common/inline/presets/markdown.js';
import { ReferenceNodeConfig } from '../_common/inline/presets/nodes/reference-node/reference-config.js';
import type { ListBlockModel } from './list-model.js';
import { listPrefix, toggleStyles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';

export class ListService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<ListBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();
  readonly referenceNodeConfig = new ReferenceNodeConfig();
  readonly getListIcon = ListIcon;
  readonly getListInfo = getListInfo;
  readonly listPrefixStyles = listPrefix;
  readonly toggleStyles = toggleStyles;

  override mounted(): void {
    super.mounted();

    this.referenceNodeConfig.setPage(this.page);

    const inlineSpecs = getAffineInlineSpecsWithReference(
      this.referenceNodeConfig
    );
    this.inlineManager.registerSpecs(inlineSpecs);
    this.inlineManager.registerMarkdownMatches(affineInlineMarkdownMatches);
  }
}
