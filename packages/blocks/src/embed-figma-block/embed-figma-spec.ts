import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
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
  },
  service: EmbedFigmaBlockService,
});
