import { createEmbedBlockHtmlAdapterMatcher } from '@labre/affine-block-embed';
import { BookmarkBlockSchema } from '@labre/affine-model';
import { BlockHtmlAdapterExtension } from '@labre/affine-shared/adapters';

export const bookmarkBlockHtmlAdapterMatcher =
  createEmbedBlockHtmlAdapterMatcher(BookmarkBlockSchema.model.flavour);

export const BookmarkBlockHtmlAdapterExtension = BlockHtmlAdapterExtension(
  bookmarkBlockHtmlAdapterMatcher
);
