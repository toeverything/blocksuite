import { literal, unsafeStatic } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import {
  type EmbedFigmaBlockProps,
  EmbedFigmaModel,
  EmbedFigmaStyles,
} from './embed-figma-model.js';
import { EmbedFigmaBlockService } from './embed-figma-service.js';

const defaultEmbedFigmaProps: EmbedFigmaBlockProps = {
  style: EmbedFigmaStyles[0],
  url: '',
  caption: null,

  title: null,
  description: null,
};

export const EmbedFigmaBlockSpec = createEmbedBlock({
  schema: {
    name: 'figma',
    version: 1,
    toModel: () => new EmbedFigmaModel(),
    props: (): EmbedFigmaBlockProps => defaultEmbedFigmaProps,
  },
  view: {
    component: literal`affine-embed-figma-block`,
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: EmbedFigmaBlockService,
});
