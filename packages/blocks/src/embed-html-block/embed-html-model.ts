import { EmbedBlockModel } from '../_common/embed-block-helper/index.js';

export type EmbedHtmlBlockProps = {
  html?: string;
  design?: string;
};

export class EmbedHtmlBlockModel extends EmbedBlockModel<EmbedHtmlBlockProps> {}
