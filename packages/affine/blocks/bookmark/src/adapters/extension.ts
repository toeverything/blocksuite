import type { ExtensionType } from '@blocksuite/store';

import { BookmarkBlockHtmlAdapterExtension } from './html.js';
import { BookmarkBlockMarkdownAdapterExtension } from './markdown.js';
import { BookmarkBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { BookmarkBlockPlainTextAdapterExtension } from './plain-text.js';

export const BookmarkBlockAdapterExtensions: ExtensionType[] = [
  BookmarkBlockHtmlAdapterExtension,
  BookmarkBlockMarkdownAdapterExtension,
  BookmarkBlockNotionHtmlAdapterExtension,
  BookmarkBlockPlainTextAdapterExtension,
];
