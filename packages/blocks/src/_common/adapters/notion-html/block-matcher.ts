import type { BlockNotionHtmlAdapterMatcher } from '@blocksuite/affine-shared/adapters';
import type { ExtensionType } from '@blocksuite/block-std';

import {
  ListBlockNotionHtmlAdapterExtension,
  listBlockNotionHtmlAdapterMatcher,
} from '@blocksuite/affine-block-list';
import {
  ParagraphBlockNotionHtmlAdapterExtension,
  paragraphBlockNotionHtmlAdapterMatcher,
} from '@blocksuite/affine-block-paragraph';

import {
  AttachmentBlockNotionHtmlAdapterExtension,
  attachmentBlockNotionHtmlAdapterMatcher,
} from '../../../attachment-block/adapters/notion-html.js';
import {
  BookmarkBlockNotionHtmlAdapterExtension,
  bookmarkBlockNotionHtmlAdapterMatcher,
} from '../../../bookmark-block/adapters/notion-html.js';
import {
  CodeBlockNotionHtmlAdapterExtension,
  codeBlockNotionHtmlAdapterMatcher,
} from '../../../code-block/adapters/notion-html.js';
import {
  DatabaseBlockNotionHtmlAdapterExtension,
  databaseBlockNotionHtmlAdapterMatcher,
} from '../../../database-block/adapters/notion-html.js';
import {
  DividerBlockNotionHtmlAdapterExtension,
  dividerBlockNotionHtmlAdapterMatcher,
} from '../../../divider-block/adapters/notion-html.js';
import {
  ImageBlockNotionHtmlAdapterExtension,
  imageBlockNotionHtmlAdapterMatcher,
} from '../../../image-block/adapters/notion-html.js';
import {
  LatexBlockNotionHtmlAdapterExtension,
  latexBlockNotionHtmlAdapterMatcher,
} from '../../../latex-block/adapters/notion-html.js';
import {
  RootBlockNotionHtmlAdapterExtension,
  rootBlockNotionHtmlAdapterMatcher,
} from '../../../root-block/adapters/notion-html.js';

export const defaultBlockNotionHtmlAdapterMatchers: BlockNotionHtmlAdapterMatcher[] =
  [
    listBlockNotionHtmlAdapterMatcher,
    paragraphBlockNotionHtmlAdapterMatcher,
    codeBlockNotionHtmlAdapterMatcher,
    dividerBlockNotionHtmlAdapterMatcher,
    imageBlockNotionHtmlAdapterMatcher,
    rootBlockNotionHtmlAdapterMatcher,
    bookmarkBlockNotionHtmlAdapterMatcher,
    databaseBlockNotionHtmlAdapterMatcher,
    attachmentBlockNotionHtmlAdapterMatcher,
    latexBlockNotionHtmlAdapterMatcher,
  ];

export const BlockNotionHtmlAdapterExtensions: ExtensionType[] = [
  ListBlockNotionHtmlAdapterExtension,
  ParagraphBlockNotionHtmlAdapterExtension,
  CodeBlockNotionHtmlAdapterExtension,
  DividerBlockNotionHtmlAdapterExtension,
  ImageBlockNotionHtmlAdapterExtension,
  RootBlockNotionHtmlAdapterExtension,
  BookmarkBlockNotionHtmlAdapterExtension,
  DatabaseBlockNotionHtmlAdapterExtension,
  AttachmentBlockNotionHtmlAdapterExtension,
  LatexBlockNotionHtmlAdapterExtension,
];
