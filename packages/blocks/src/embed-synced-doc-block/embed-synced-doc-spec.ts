import { literal, unsafeStatic } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/helper.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import {
  type EmbedSyncedDocBlockProps,
  EmbedSyncedDocModel,
  EmbedSyncedDocStyles,
} from './embed-synced-doc-model.js';
import { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

export const defaultEmbedSyncedDocBlockProps: EmbedSyncedDocBlockProps = {
  pageId: '',
  style: EmbedSyncedDocStyles[0],
  caption: undefined,
  scale: undefined,
};

export const EmbedSyncedDocBlockSpec = createEmbedBlock({
  schema: {
    name: 'synced-doc',
    version: 1,
    toModel: () => new EmbedSyncedDocModel(),
    props: (): EmbedSyncedDocBlockProps => defaultEmbedSyncedDocBlockProps,
  },
  view: {
    component: literal`affine-embed-synced-doc-block`,
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: EmbedSyncedDocBlockService,
});
