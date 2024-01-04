import { BlockService } from '@blocksuite/block-std';

import { InlineManager } from '../_common/inline/inline-manager.js';
import {
  affineInlineSpecs,
  type AffineTextAttributes,
} from '../_common/inline/presets/affine-inline-specs.js';
import { affineInlineMarkdownMatches } from '../_common/inline/presets/markdown.js';
import type { ListBlockModel } from './list-model.js';

export class ListService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<ListBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();

  override mounted(): void {
    super.mounted();
    (
      this.inlineManager as unknown as InlineManager<AffineTextAttributes>
    ).registerSpecs(affineInlineSpecs);
    (
      this.inlineManager as unknown as InlineManager<AffineTextAttributes>
    ).registerMarkdownMatches(affineInlineMarkdownMatches);
  }
}
