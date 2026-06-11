import type { ExtensionType } from '@labre/store';

import { LatexMarkdownAdapterExtensions } from './markdown/index.js';
import { LatexBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { LatexBlockPlainTextAdapterExtension } from './plain-text.js';

export const LatexBlockAdapterExtensions: ExtensionType[] = [
  LatexMarkdownAdapterExtensions,
  LatexBlockNotionHtmlAdapterExtension,
  LatexBlockPlainTextAdapterExtension,
].flat();
