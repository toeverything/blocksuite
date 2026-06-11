import { createEmbedBlockPlainTextAdapterMatcher } from '@labre/affine-block-embed';
import { BookmarkBlockSchema } from '@labre/affine-model';
import { BlockPlainTextAdapterExtension } from '@labre/affine-shared/adapters';

export const bookmarkBlockPlainTextAdapterMatcher =
  createEmbedBlockPlainTextAdapterMatcher(BookmarkBlockSchema.model.flavour);

export const BookmarkBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(bookmarkBlockPlainTextAdapterMatcher);
