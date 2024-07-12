import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedFigmaBlockProps,
  EmbedFigmaModel,
  EmbedFigmaStyles,
} from './embed-figma-model.js';

const defaultEmbedFigmaProps: EmbedFigmaBlockProps = {
  caption: null,
  description: null,
  style: EmbedFigmaStyles[0],

  title: null,
  url: '',
};

export const EmbedFigmaBlockSchema = createEmbedBlockSchema({
  name: 'figma',
  props: (): EmbedFigmaBlockProps => defaultEmbedFigmaProps,
  toModel: () => new EmbedFigmaModel(),
  version: 1,
});
