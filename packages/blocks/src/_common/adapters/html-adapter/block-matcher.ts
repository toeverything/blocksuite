import {
  embedFigmaBlockHtmlAdapterMatcher,
  embedGithubBlockHtmlAdapterMatcher,
  embedLinkedDocBlockHtmlAdapterMatcher,
  embedLoomBlockHtmlAdapterMatcher,
  embedSyncedDocBlockHtmlAdapterMatcher,
  embedYoutubeBlockHtmlAdapterMatcher,
} from '@blocksuite/affine-block-embed';
import { listBlockHtmlAdapterMatcher } from '@blocksuite/affine-block-list';
import { paragraphBlockHtmlAdapterMatcher } from '@blocksuite/affine-block-paragraph';

import { bookmarkBlockHtmlAdapterMatcher } from '../../../bookmark-block/adapters/html.js';
import { codeBlockHtmlAdapterMatcher } from '../../../code-block/adapters/html.js';
import { databaseBlockHtmlAdapterMatcher } from '../../../database-block/adapters/html.js';
import { dividerBlockHtmlAdapterMatcher } from '../../../divider-block/adapters/html.js';
import { imageBlockHtmlAdapterMatcher } from '../../../image-block/adapters/html.js';
import { rootBlockHtmlAdapterMatcher } from '../../../root-block/adapters/html.js';

export const defaultBlockHtmlAdapterMatchers = [
  listBlockHtmlAdapterMatcher,
  paragraphBlockHtmlAdapterMatcher,
  codeBlockHtmlAdapterMatcher,
  dividerBlockHtmlAdapterMatcher,
  imageBlockHtmlAdapterMatcher,
  rootBlockHtmlAdapterMatcher,
  embedYoutubeBlockHtmlAdapterMatcher,
  embedFigmaBlockHtmlAdapterMatcher,
  embedLoomBlockHtmlAdapterMatcher,
  embedGithubBlockHtmlAdapterMatcher,
  bookmarkBlockHtmlAdapterMatcher,
  databaseBlockHtmlAdapterMatcher,
  embedLinkedDocBlockHtmlAdapterMatcher,
  embedSyncedDocBlockHtmlAdapterMatcher,
];
