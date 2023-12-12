import { BaseBlockModel } from '@blocksuite/store';

import { makeEmbedModel } from '../_common/embed-block-helper/index.js';

export type EmbedHtmlBlockProps = {
  html?: string;
  design?: string;
};

export class EmbedHtmlBlockModel extends makeEmbedModel<EmbedHtmlBlockProps>(
  BaseBlockModel
) {}
