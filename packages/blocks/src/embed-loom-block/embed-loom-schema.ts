import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedLoomBlockProps,
  EmbedLoomModel,
  EmbedLoomStyles,
} from './embed-loom-model.js';

const defaultEmbedLoomProps: EmbedLoomBlockProps = {
  style: EmbedLoomStyles[0],
  url: '',
  caption: null,

  image: null,
  title: null,
  description: null,
  videoId: null,
};

export const EmbedLoomBlockSchema = createEmbedBlockSchema({
  name: 'loom',
  version: 1,
  toModel: () => new EmbedLoomModel(),
  props: (): EmbedLoomBlockProps => defaultEmbedLoomProps,
});
