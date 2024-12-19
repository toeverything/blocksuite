import {
  embedFigmaBlockMarkdownAdapterMatcher,
  embedGithubBlockMarkdownAdapterMatcher,
  embedLinkedDocBlockMarkdownAdapterMatcher,
  embedLoomBlockMarkdownAdapterMatcher,
  embedSyncedDocBlockMarkdownAdapterMatcher,
  embedYoutubeBlockMarkdownAdapterMatcher,
} from '@blocksuite/affine-block-embed';
import { listBlockMarkdownAdapterMatcher } from '@blocksuite/affine-block-list';
import { paragraphBlockMarkdownAdapterMatcher } from '@blocksuite/affine-block-paragraph';

import { bookmarkBlockMarkdownAdapterMatcher } from '../../../bookmark-block/adapters/markdown.js';
import { codeBlockMarkdownAdapterMatcher } from '../../../code-block/adapters/markdown.js';
import { databaseBlockMarkdownAdapterMatcher } from '../../../database-block/adapters/markdown.js';
import { dividerBlockMarkdownAdapterMatcher } from '../../../divider-block/adapters/markdown.js';
import { imageBlockMarkdownAdapterMatcher } from '../../../image-block/adapters/markdown.js';
import { latexBlockMarkdownAdapterMatcher } from '../../../latex-block/adapters/markdown.js';
import { rootBlockMarkdownAdapterMatcher } from '../../../root-block/adapters/markdown.js';

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
