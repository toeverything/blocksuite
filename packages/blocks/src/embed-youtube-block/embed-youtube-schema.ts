import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedYoutubeBlockProps,
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from './embed-youtube-model.js';

const defaultEmbedYoutubeProps: EmbedYoutubeBlockProps = {
  caption: null,
  creator: null,
  creatorImage: null,

  creatorUrl: null,
  description: null,
  image: null,
  style: EmbedYoutubeStyles[0],
  title: null,
  url: '',
  videoId: null,
};

export const EmbedYoutubeBlockSchema = createEmbedBlockSchema({
  name: 'youtube',
  props: (): EmbedYoutubeBlockProps => defaultEmbedYoutubeProps,
  toModel: () => new EmbedYoutubeModel(),
  version: 1,
});
