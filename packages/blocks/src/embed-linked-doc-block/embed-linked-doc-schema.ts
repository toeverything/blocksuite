import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedLinkedDocBlockProps,
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';

const defaultEmbedLinkedDocBlockProps: EmbedLinkedDocBlockProps = {
  pageId: '',
  style: EmbedLinkedDocStyles[1],
  caption: null,
};

export const EmbedLinkedDocBlockSchema = createEmbedBlockSchema({
  name: 'linked-doc',
  version: 1,
  toModel: () => new EmbedLinkedDocModel(),
  props: (): EmbedLinkedDocBlockProps => defaultEmbedLinkedDocBlockProps,
});
