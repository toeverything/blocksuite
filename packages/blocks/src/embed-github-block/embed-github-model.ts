import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedGithubBlockProps } from './types.js';

export class EmbedGithubModel extends defineEmbedModel<EmbedGithubBlockProps>(
  BlockModel
) {}
