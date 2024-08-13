import type { EmbedLinkedBlockBlockProps } from './linked-block-model.js';

import { createEmbedBlockSchema } from '../../../utils/index.js';
import { EmbedLinkedDocStyles } from '../linked-doc/linked-doc-model.js';
import { EmbedLinkedBlockModel } from './linked-block-model.js';

const defaultEmbedLinkedBlockBlockProps: EmbedLinkedBlockBlockProps = {
  mode: 'page',
  blockId: '',
  pageId: '',
  style: EmbedLinkedDocStyles[1],
  caption: null,
};

export const EmbedLinkedBlockBlockSchema = createEmbedBlockSchema({
  name: 'linked-block',
  version: 1,
  toModel: () => new EmbedLinkedBlockModel(),
  props: (): EmbedLinkedBlockBlockProps => defaultEmbedLinkedBlockBlockProps,
});
