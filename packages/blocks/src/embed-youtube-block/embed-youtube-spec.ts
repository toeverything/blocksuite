import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import {
  type EmbedYoutubeBlockProps,
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from './embed-youtube-model.js';
import { EmbedYoutubeService } from './embed-youtube-service.js';

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
  },
  service: EmbedYoutubeService,
});
