import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedSyncedDocBlockProps,
  EmbedSyncedDocModel,
  EmbedSyncedDocStyles,
} from './embed-synced-doc-model.js';
import { EmbedSyncedDocService } from './embed-synced-doc-service.js';

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
  },
  service: EmbedSyncedDocService,
});
