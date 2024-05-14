import { literal, unsafeStatic } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import {
  type EmbedLoomBlockProps,
  EmbedLoomModel,
  EmbedLoomStyles,
} from './embed-loom-model.js';
import { EmbedLoomBlockService } from './embed-loom-service.js';

const defaultEmbedLoomProps: EmbedLoomBlockProps = {
  style: EmbedLoomStyles[0],
  url: '',
  caption: null,

  image: null,
  title: null,
  description: null,
  videoId: null,
};

export const EmbedLoomBlockSpec = createEmbedBlock({
  schema: {
    name: 'loom',
    version: 1,
    toModel: () => new EmbedLoomModel(),
    props: (): EmbedLoomBlockProps => defaultEmbedLoomProps,
  },
  view: {
    component: literal`affine-embed-loom-block`,
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: EmbedLoomBlockService,
});
