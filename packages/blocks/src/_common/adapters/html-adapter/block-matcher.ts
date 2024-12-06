import type { ExtensionType } from '@blocksuite/block-std';

import {
  EmbedYoutubeBlockHtmlAdapterExtension,
  embedYoutubeBlockHtmlAdapterMatcher,
} from '@blocksuite/affine-block-embed';
import {
  ListBlockHtmlAdapterExtension,
  listBlockHtmlAdapterMatcher,
} from '@blocksuite/affine-block-list';
import {
  ParagraphBlockHtmlAdapterExtension,
  paragraphBlockHtmlAdapterMatcher,
} from '@blocksuite/affine-block-paragraph';

import {
  CodeBlockHtmlAdapterExtension,
  codeBlockHtmlAdapterMatcher,
} from '../../../code-block/adapters/html.js';
import {
  DividerBlockHtmlAdapterExtension,
  dividerBlockHtmlAdapterMatcher,
} from '../../../divider-block/adapters/html.js';
import {
  ImageBlockHtmlAdapterExtension,
  imageBlockHtmlAdapterMatcher,
} from '../../../image-block/adapters/html.js';
import {
  RootBlockHtmlAdapterExtension,
  rootBlockHtmlAdapterMatcher,
} from '../../../root-block/adapters/html.js';

export const defaultBlockHtmlAdapterMatchers = [
  listBlockHtmlAdapterMatcher,
  paragraphBlockHtmlAdapterMatcher,
  codeBlockHtmlAdapterMatcher,
  dividerBlockHtmlAdapterMatcher,
  imageBlockHtmlAdapterMatcher,
  rootBlockHtmlAdapterMatcher,
  embedYoutubeBlockHtmlAdapterMatcher,
];

export const BlockHtmlAdapterExtensions: ExtensionType[] = [
  ListBlockHtmlAdapterExtension,
  ParagraphBlockHtmlAdapterExtension,
  CodeBlockHtmlAdapterExtension,
  DividerBlockHtmlAdapterExtension,
  ImageBlockHtmlAdapterExtension,
  RootBlockHtmlAdapterExtension,
  EmbedYoutubeBlockHtmlAdapterExtension,
];
