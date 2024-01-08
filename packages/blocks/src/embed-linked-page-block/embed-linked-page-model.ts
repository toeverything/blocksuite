import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedLinkedPageBlockProps } from './types.js';

export class EmbedLinkedPageModel extends defineEmbedModel<EmbedLinkedPageBlockProps>(
  BlockModel
) {}
