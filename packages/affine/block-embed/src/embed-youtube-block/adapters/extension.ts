import type { ExtensionType } from '@blocksuite/block-std';

import { EmbedYoutubeBlockHtmlAdapterExtension } from './html.js';
import { EmbedYoutubeMarkdownAdapterExtension } from './markdown.js';
import { EmbedYoutubeNotionHtmlAdapterExtension } from './notion-html.js';
import { EmbedYoutubeBlockPlainTextAdapterExtension } from './plain-text.js';

export const EmbedYoutubeBlockAdapterExtensions: ExtensionType[] = [
  EmbedYoutubeBlockHtmlAdapterExtension,
  EmbedYoutubeMarkdownAdapterExtension,
  EmbedYoutubeBlockPlainTextAdapterExtension,
  EmbedYoutubeNotionHtmlAdapterExtension,
];
