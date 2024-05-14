import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import {
  type EmbedHtmlBlockProps,
  EmbedHtmlModel,
  EmbedHtmlStyles,
} from './embed-html-model.js';
import { EmbedHtmlBlockService } from './embed-html-service.js';

const defaultEmbedHtmlProps: EmbedHtmlBlockProps = {
  style: EmbedHtmlStyles[0],
  caption: null,
  html: undefined,
  design: undefined,
};

export const EmbedHtmlBlockSpec = createEmbedBlock({
  schema: {
    name: 'html',
    version: 1,
    toModel: () => new EmbedHtmlModel(),
    props: (): EmbedHtmlBlockProps => defaultEmbedHtmlProps,
  },
  view: {
    component: literal`affine-embed-html-block`,
  },
  service: EmbedHtmlBlockService,
});
