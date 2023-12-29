import { BaseBlockModel } from '@blocksuite/store';

import { makeEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedLinkedPageBlockProps } from './types.js';

export class EmbedLinkedPageBlockModel extends makeEmbedModel<EmbedLinkedPageBlockProps>(
  BaseBlockModel
) {}
