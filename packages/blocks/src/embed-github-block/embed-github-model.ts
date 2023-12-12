import { BaseBlockModel } from '@blocksuite/store';

import { makeEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedGithubBlockProps } from './types.js';

export class EmbedGithubBlockModel extends makeEmbedModel<EmbedGithubBlockProps>(
  BaseBlockModel
) {}
