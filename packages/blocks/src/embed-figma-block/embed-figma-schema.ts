import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedFigmaBlockProps,
  EmbedFigmaModel,
  EmbedFigmaStyles,
} from './embed-figma-model.js';

const defaultEmbedFigmaProps: EmbedFigmaBlockProps = {
  style: EmbedFigmaStyles[0],
  url: '',
  caption: null,

  title: null,
  description: null,
};

export const EmbedFigmaBlockSchema = createEmbedBlockSchema({
  name: 'figma',
  version: 1,
  toModel: () => new EmbedFigmaModel(),
  props: (): EmbedFigmaBlockProps => defaultEmbedFigmaProps,
});
