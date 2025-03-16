import { createEmbedBlockMarkdownAdapterMatcher } from '@blocksuite/affine-block-embed';
import { BookmarkBlockSchema } from '@blocksuite/affine-model';
import { BlockMarkdownAdapterExtension } from '@blocksuite/affine-shared/adapters';

export const bookmarkBlockMarkdownAdapterMatcher =
  createEmbedBlockMarkdownAdapterMatcher(BookmarkBlockSchema.model.flavour);

export const BookmarkBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(bookmarkBlockMarkdownAdapterMatcher);
