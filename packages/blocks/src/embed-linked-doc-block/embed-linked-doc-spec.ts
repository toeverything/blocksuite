import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import {
  type EmbedLinkedDocBlockProps,
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';
import { EmbedLinkedDocService } from './embed-linked-doc-service.js';

const defaultEmbedLinkedDocBlockProps: EmbedLinkedDocBlockProps = {
  style: EmbedLinkedDocStyles[1],
  pageId: '',
  caption: null,
};

export const EmbedLinkedDocBlockSpec = createEmbedBlock({
  schema: {
    name: 'linked-doc',
    version: 1,
    toModel: () => new EmbedLinkedDocModel(),
    props: (): EmbedLinkedDocBlockProps => defaultEmbedLinkedDocBlockProps,
  },

  view: {
    component: literal`affine-embed-linked-doc-block`,
  },
  service: EmbedLinkedDocService,
});
