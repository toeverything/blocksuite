import { literal, unsafeStatic } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/helper.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import {
  type EmbedLinkedDocBlockProps,
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';
import { EmbedLinkedDocBlockService } from './embed-linked-doc-service.js';

const defaultEmbedLinkedDocBlockProps: EmbedLinkedDocBlockProps = {
  pageId: '',
  style: EmbedLinkedDocStyles[1],
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
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: EmbedLinkedDocBlockService,
});
