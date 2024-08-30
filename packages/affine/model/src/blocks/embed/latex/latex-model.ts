import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../../../utils/helper.js';

export type EmbedLatexBlockProps = {
  latex: string;
};

export class EmbedLatexBlockModel extends defineEmbedModel<EmbedLatexBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-latex': EmbedLatexBlockModel;
    }
    interface BlockModels {
      'affine:embed-latex': EmbedLatexBlockModel;
    }
  }
}
