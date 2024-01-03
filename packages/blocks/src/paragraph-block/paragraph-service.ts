import { BlockService } from '@blocksuite/block-std';

import { InlineManager } from '../_common/inline/inline-manager.js';
import {
  affineInlineSpecs,
  type AffineTextAttributes,
} from '../_common/inline/presets/affine-inline-specs.js';
import { affineInlineMarkdownMatches } from '../_common/inline/presets/markdown.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

export class ParagraphService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<ParagraphBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();

  override mounted(): void {
    super.mounted();
    this.inlineManager.registerSpecs(affineInlineSpecs);
    this.inlineManager.registerMarkdownMatches(affineInlineMarkdownMatches);
  }
}
