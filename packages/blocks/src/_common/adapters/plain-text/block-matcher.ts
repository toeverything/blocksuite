import type { BlockPlainTextAdapterMatcher } from '@blocksuite/affine-shared/adapters';
import type { ExtensionType } from '@blocksuite/block-std';

import {
  EmbedFigmaBlockPlainTextAdapterExtension,
  embedFigmaBlockPlainTextAdapterMatcher,
  EmbedGithubBlockPlainTextAdapterExtension,
  embedGithubBlockPlainTextAdapterMatcher,
  EmbedLinkedDocBlockPlainTextAdapterExtension,
  embedLinkedDocBlockPlainTextAdapterMatcher,
  EmbedLoomBlockPlainTextAdapterExtension,
  embedLoomBlockPlainTextAdapterMatcher,
  EmbedSyncedDocBlockPlainTextAdapterExtension,
  embedSyncedDocBlockPlainTextAdapterMatcher,
  EmbedYoutubeBlockPlainTextAdapterExtension,
  embedYoutubeBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-embed';
import {
  ListBlockPlainTextAdapterExtension,
  listBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-list';
import {
  ParagraphBlockPlainTextAdapterExtension,
  paragraphBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-paragraph';

import {
  BookmarkBlockPlainTextAdapterExtension,
  bookmarkBlockPlainTextAdapterMatcher,
} from '../../../bookmark-block/adapters/plain-text.js';
import {
  CodeBlockPlainTextAdapterExtension,
  codeBlockPlainTextAdapterMatcher,
} from '../../../code-block/adapters/plain-text.js';
import {
  DividerBlockPlainTextAdapterExtension,
  dividerBlockPlainTextAdapterMatcher,
} from '../../../divider-block/adapters/plain-text.js';
import {
  LatexBlockPlainTextAdapterExtension,
  latexBlockPlainTextAdapterMatcher,
} from '../../../latex-block/adapters/plain-text.js';

export const defaultBlockPlainTextAdapterMatchers: BlockPlainTextAdapterMatcher[] =
  [
    paragraphBlockPlainTextAdapterMatcher,
    listBlockPlainTextAdapterMatcher,
    dividerBlockPlainTextAdapterMatcher,
    codeBlockPlainTextAdapterMatcher,
    bookmarkBlockPlainTextAdapterMatcher,
    embedFigmaBlockPlainTextAdapterMatcher,
    embedGithubBlockPlainTextAdapterMatcher,
    embedLoomBlockPlainTextAdapterMatcher,
    embedYoutubeBlockPlainTextAdapterMatcher,
    embedLinkedDocBlockPlainTextAdapterMatcher,
    embedSyncedDocBlockPlainTextAdapterMatcher,
    latexBlockPlainTextAdapterMatcher,
  ];

export const BlockPlainTextAdapterExtensions: ExtensionType[] = [
  ParagraphBlockPlainTextAdapterExtension,
  ListBlockPlainTextAdapterExtension,
  DividerBlockPlainTextAdapterExtension,
  CodeBlockPlainTextAdapterExtension,
  BookmarkBlockPlainTextAdapterExtension,
  EmbedFigmaBlockPlainTextAdapterExtension,
  EmbedGithubBlockPlainTextAdapterExtension,
  EmbedLoomBlockPlainTextAdapterExtension,
  EmbedYoutubeBlockPlainTextAdapterExtension,
  EmbedLinkedDocBlockPlainTextAdapterExtension,
  EmbedSyncedDocBlockPlainTextAdapterExtension,
  LatexBlockPlainTextAdapterExtension,
];
