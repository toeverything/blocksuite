import type { ExtensionType } from '@blocksuite/block-std';

import {
  embedFigmaBlockMarkdownAdapterMatcher,
  EmbedFigmaMarkdownAdapterExtension,
  embedGithubBlockMarkdownAdapterMatcher,
  EmbedGithubMarkdownAdapterExtension,
  embedLinkedDocBlockMarkdownAdapterMatcher,
  EmbedLinkedDocMarkdownAdapterExtension,
  embedLoomBlockMarkdownAdapterMatcher,
  EmbedLoomMarkdownAdapterExtension,
  EmbedSyncedDocBlockMarkdownAdapterExtension,
  embedSyncedDocBlockMarkdownAdapterMatcher,
  embedYoutubeBlockMarkdownAdapterMatcher,
  EmbedYoutubeMarkdownAdapterExtension,
} from '@blocksuite/affine-block-embed';
import {
  ListBlockMarkdownAdapterExtension,
  listBlockMarkdownAdapterMatcher,
} from '@blocksuite/affine-block-list';
import {
  ParagraphBlockMarkdownAdapterExtension,
  paragraphBlockMarkdownAdapterMatcher,
} from '@blocksuite/affine-block-paragraph';

import {
  BookmarkBlockMarkdownAdapterExtension,
  bookmarkBlockMarkdownAdapterMatcher,
} from '../../../bookmark-block/adapters/markdown.js';
import {
  CodeBlockMarkdownAdapterExtension,
  codeBlockMarkdownAdapterMatcher,
} from '../../../code-block/adapters/markdown.js';
import {
  DatabaseBlockMarkdownAdapterExtension,
  databaseBlockMarkdownAdapterMatcher,
} from '../../../database-block/adapters/markdown.js';
import {
  DividerBlockMarkdownAdapterExtension,
  dividerBlockMarkdownAdapterMatcher,
} from '../../../divider-block/adapters/markdown.js';
import {
  ImageBlockMarkdownAdapterExtension,
  imageBlockMarkdownAdapterMatcher,
} from '../../../image-block/adapters/markdown.js';
import {
  LatexBlockMarkdownAdapterExtension,
  latexBlockMarkdownAdapterMatcher,
} from '../../../latex-block/adapters/markdown.js';
import {
  RootBlockMarkdownAdapterExtension,
  rootBlockMarkdownAdapterMatcher,
} from '../../../root-block/adapters/markdown.js';

export const defaultBlockMarkdownAdapterMatchers = [
  embedFigmaBlockMarkdownAdapterMatcher,
  embedGithubBlockMarkdownAdapterMatcher,
  embedLinkedDocBlockMarkdownAdapterMatcher,
  embedLoomBlockMarkdownAdapterMatcher,
  embedSyncedDocBlockMarkdownAdapterMatcher,
  embedYoutubeBlockMarkdownAdapterMatcher,
  listBlockMarkdownAdapterMatcher,
  paragraphBlockMarkdownAdapterMatcher,
  bookmarkBlockMarkdownAdapterMatcher,
  codeBlockMarkdownAdapterMatcher,
  databaseBlockMarkdownAdapterMatcher,
  dividerBlockMarkdownAdapterMatcher,
  imageBlockMarkdownAdapterMatcher,
  latexBlockMarkdownAdapterMatcher,
  rootBlockMarkdownAdapterMatcher,
];

export const BlockMarkdownAdapterExtensions: ExtensionType[] = [
  EmbedFigmaMarkdownAdapterExtension,
  EmbedGithubMarkdownAdapterExtension,
  EmbedLinkedDocMarkdownAdapterExtension,
  EmbedLoomMarkdownAdapterExtension,
  EmbedSyncedDocBlockMarkdownAdapterExtension,
  EmbedYoutubeMarkdownAdapterExtension,
  ListBlockMarkdownAdapterExtension,
  ParagraphBlockMarkdownAdapterExtension,
  BookmarkBlockMarkdownAdapterExtension,
  CodeBlockMarkdownAdapterExtension,
  DatabaseBlockMarkdownAdapterExtension,
  DividerBlockMarkdownAdapterExtension,
  ImageBlockMarkdownAdapterExtension,
  LatexBlockMarkdownAdapterExtension,
  RootBlockMarkdownAdapterExtension,
];
