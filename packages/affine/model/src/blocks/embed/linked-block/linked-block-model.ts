import { BlockModel } from '@blocksuite/store';

import type { EmbedLinkedDocBlockProps } from '../linked-doc/linked-doc-model.js';

import { defineEmbedModel } from '../../../utils/index.js';

export type EmbedLinkedBlockBlockProps = EmbedLinkedDocBlockProps & {
  mode: 'page' | 'edgeless';
  blockId: string;
};

export class EmbedLinkedBlockModel extends defineEmbedModel<EmbedLinkedBlockBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-linked-block': EmbedLinkedBlockModel;
    }
    interface BlockModels {
      'affine:embed-linked-block': EmbedLinkedBlockModel;
    }
  }
}
