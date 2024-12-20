import type { ExtensionType } from '@blocksuite/block-std';

import { EmbedFigmaBlockHtmlAdapterExtension } from './html.js';
import { EmbedFigmaMarkdownAdapterExtension } from './markdown.js';
import { EmbedFigmaNotionHtmlAdapterExtension } from './notion-html.js';
import { EmbedFigmaBlockPlainTextAdapterExtension } from './plain-text.js';

export const EmbedFigmaBlockAdapterExtensions: ExtensionType[] = [
  EmbedFigmaBlockHtmlAdapterExtension,
  EmbedFigmaMarkdownAdapterExtension,
  EmbedFigmaBlockPlainTextAdapterExtension,
  EmbedFigmaNotionHtmlAdapterExtension,
];
