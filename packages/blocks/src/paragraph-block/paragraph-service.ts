import type { ParagraphBlockModel } from '@blocksuite/affine-model';

import {
  type AffineTextAttributes,
  InlineManager,
  ReferenceNodeConfig,
  affineInlineMarkdownMatches,
  getAffineInlineSpecsWithReference,
} from '@blocksuite/affine-components/rich-text';
import { BlockService } from '@blocksuite/block-std';

export class ParagraphBlockService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<ParagraphBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();

  placeholderGenerator: (model: ParagraphBlockModel) => string = model => {
    if (model.type === 'text') {
      return "Type '/' for commands";
    }

    const placeholders = {
      h1: 'Heading 1',
      h2: 'Heading 2',
      h3: 'Heading 3',
      h4: 'Heading 4',
      h5: 'Heading 5',
      h6: 'Heading 6',
      quote: '',
    };
    return placeholders[model.type];
  };

  readonly referenceNodeConfig = new ReferenceNodeConfig();

  override mounted(): void {
    super.mounted();

    this.referenceNodeConfig.setDoc(this.doc);

    const inlineSpecs = getAffineInlineSpecsWithReference(
      this.referenceNodeConfig
    );
    this.inlineManager.registerSpecs(inlineSpecs);
    this.inlineManager.registerMarkdownMatches(affineInlineMarkdownMatches);
  }
}
