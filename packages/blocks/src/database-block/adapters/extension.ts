import type { ExtensionType } from '@blocksuite/block-std';

import { DatabaseBlockHtmlAdapterExtension } from './html.js';
import { DatabaseBlockMarkdownAdapterExtension } from './markdown.js';
import { DatabaseBlockNotionHtmlAdapterExtension } from './notion-html.js';

export const DatabaseBlockAdapterExtensions: ExtensionType[] = [
  DatabaseBlockHtmlAdapterExtension,
  DatabaseBlockMarkdownAdapterExtension,
  DatabaseBlockNotionHtmlAdapterExtension,
];
