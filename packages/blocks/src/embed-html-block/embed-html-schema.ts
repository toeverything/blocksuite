import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedHtmlBlockProps,
  EmbedHtmlModel,
  EmbedHtmlStyles,
} from './embed-html-model.js';

const defaultEmbedHtmlProps: EmbedHtmlBlockProps = {
  style: EmbedHtmlStyles[0],
  caption: null,
  html: undefined,
  design: undefined,
};

export const EmbedHtmlBlockSchema = createEmbedBlockSchema({
  name: 'html',
  version: 1,
  toModel: () => new EmbedHtmlModel(),
  props: (): EmbedHtmlBlockProps => defaultEmbedHtmlProps,
});
