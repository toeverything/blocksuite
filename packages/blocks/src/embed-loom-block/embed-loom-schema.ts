import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedLoomBlockProps,
  EmbedLoomModel,
  EmbedLoomStyles,
} from './embed-loom-model.js';

const defaultEmbedLoomProps: EmbedLoomBlockProps = {
  caption: null,
  description: null,
  image: null,

  style: EmbedLoomStyles[0],
  title: null,
  url: '',
  videoId: null,
};

export const EmbedLoomBlockSchema = createEmbedBlockSchema({
  name: 'loom',
  props: (): EmbedLoomBlockProps => defaultEmbedLoomProps,
  toModel: () => new EmbedLoomModel(),
  version: 1,
});
