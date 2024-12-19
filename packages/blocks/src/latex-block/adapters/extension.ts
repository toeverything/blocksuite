import type { ExtensionType } from '@blocksuite/block-std';

import { LatexBlockMarkdownAdapterExtension } from './markdown.js';
import { LatexBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { LatexBlockPlainTextAdapterExtension } from './plain-text.js';

export const LatexBlockAdapterExtensions: ExtensionType[] = [
  LatexBlockMarkdownAdapterExtension,
  LatexBlockNotionHtmlAdapterExtension,
  LatexBlockPlainTextAdapterExtension,
];
