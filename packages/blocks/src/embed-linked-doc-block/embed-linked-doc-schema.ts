import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedLinkedDocBlockProps,
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';

const defaultEmbedLinkedDocBlockProps: EmbedLinkedDocBlockProps = {
  caption: null,
  pageId: '',
  style: EmbedLinkedDocStyles[1],
};

export const EmbedLinkedDocBlockSchema = createEmbedBlockSchema({
  name: 'linked-doc',
  props: (): EmbedLinkedDocBlockProps => defaultEmbedLinkedDocBlockProps,
  toModel: () => new EmbedLinkedDocModel(),
  version: 1,
});
