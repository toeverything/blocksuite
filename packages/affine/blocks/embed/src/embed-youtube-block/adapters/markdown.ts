import { EmbedYoutubeBlockSchema } from '@labre/affine-model';
import { BlockMarkdownAdapterExtension } from '@labre/affine-shared/adapters';

import { createEmbedBlockMarkdownAdapterMatcher } from '../../common/adapters/markdown.js';

export const embedYoutubeBlockMarkdownAdapterMatcher =
  createEmbedBlockMarkdownAdapterMatcher(EmbedYoutubeBlockSchema.model.flavour);

export const EmbedYoutubeMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(embedYoutubeBlockMarkdownAdapterMatcher);
