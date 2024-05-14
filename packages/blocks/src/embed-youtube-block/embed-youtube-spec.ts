import { literal, unsafeStatic } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import {
  type EmbedYoutubeBlockProps,
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from './embed-youtube-model.js';
import { EmbedYoutubeBlockService } from './embed-youtube-service.js';

const defaultEmbedYoutubeProps: EmbedYoutubeBlockProps = {
  style: EmbedYoutubeStyles[0],
  url: '',
  caption: null,

  image: null,
  title: null,
  description: null,
  creator: null,
  creatorUrl: null,
  creatorImage: null,
  videoId: null,
};

export const EmbedYoutubeBlockSpec = createEmbedBlock({
  schema: {
    name: 'youtube',
    version: 1,
    toModel: () => new EmbedYoutubeModel(),
    props: (): EmbedYoutubeBlockProps => defaultEmbedYoutubeProps,
  },
  view: {
    component: literal`affine-embed-youtube-block`,
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: EmbedYoutubeBlockService,
});
