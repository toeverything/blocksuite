import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import {
  type EmbedLinkedPageBlockProps,
  EmbedLinkedPageModel,
  EmbedLinkedPageStyles,
} from './embed-linked-page-model.js';
import { EmbedLinkedPageService } from './embed-linked-page-service.js';

const defaultEmbedLinkedPageBlockProps: EmbedLinkedPageBlockProps = {
  style: EmbedLinkedPageStyles[1],
  pageId: '',
  caption: null,
};

export const EmbedLinkedPageBlockSpec = createEmbedBlock({
  schema: {
    name: 'linked-page',
    version: 1,
    toModel: () => new EmbedLinkedPageModel(),
    props: (): EmbedLinkedPageBlockProps => defaultEmbedLinkedPageBlockProps,
  },

  view: {
    component: literal`affine-embed-linked-page-block`,
  },
  service: EmbedLinkedPageService,
});
