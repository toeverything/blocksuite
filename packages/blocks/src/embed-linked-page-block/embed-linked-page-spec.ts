import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EmbedLinkedPageModel } from './embed-linked-page-model.js';
import { EmbedLinkedPageBlockService } from './embed-linked-page-service.js';

export const EmbedLinkedPageBlockSpec = createEmbedBlock({
  schema: {
    name: 'linked-page',
    version: 1,
    toModel: () => new EmbedLinkedPageModel(),
    props: () => ({
      pageId: '',
    }),
  },
  service: EmbedLinkedPageBlockService,
  view: {
    component: literal`affine-embed-linked-page-block`,
  },
});
