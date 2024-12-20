import type { BlockPlainTextAdapterMatcher } from '@blocksuite/affine-shared/adapters';

import {
  embedFigmaBlockPlainTextAdapterMatcher,
  embedGithubBlockPlainTextAdapterMatcher,
  embedLinkedDocBlockPlainTextAdapterMatcher,
  embedLoomBlockPlainTextAdapterMatcher,
  embedSyncedDocBlockPlainTextAdapterMatcher,
  embedYoutubeBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-embed';
import { listBlockPlainTextAdapterMatcher } from '@blocksuite/affine-block-list';
import { paragraphBlockPlainTextAdapterMatcher } from '@blocksuite/affine-block-paragraph';

import { bookmarkBlockPlainTextAdapterMatcher } from '../../../bookmark-block/adapters/plain-text.js';
import { codeBlockPlainTextAdapterMatcher } from '../../../code-block/adapters/plain-text.js';
import { databaseBlockPlainTextAdapterMatcher } from '../../../database-block/adapters/plain-text.js';
import { dividerBlockPlainTextAdapterMatcher } from '../../../divider-block/adapters/plain-text.js';
import { latexBlockPlainTextAdapterMatcher } from '../../../latex-block/adapters/plain-text.js';

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
    databaseBlockPlainTextAdapterMatcher,
  ];
