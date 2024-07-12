import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedHtmlBlockProps,
  EmbedHtmlModel,
  EmbedHtmlStyles,
} from './embed-html-model.js';

const defaultEmbedHtmlProps: EmbedHtmlBlockProps = {
  caption: null,
  design: undefined,
  html: undefined,
  style: EmbedHtmlStyles[0],
};

export const EmbedHtmlBlockSchema = createEmbedBlockSchema({
  name: 'html',
  props: (): EmbedHtmlBlockProps => defaultEmbedHtmlProps,
  toModel: () => new EmbedHtmlModel(),
  version: 1,
});
