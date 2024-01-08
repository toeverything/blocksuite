import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EmbedHtmlModel } from './embed-html-model.js';

export const EmbedHtmlBlockSpec = createEmbedBlock({
  schema: {
    name: 'html',
    version: 1,
    toModel: () => new EmbedHtmlModel(),
    props: () => ({}),
  },
  view: {
    component: literal`affine-embed-html-block`,
  },
});
