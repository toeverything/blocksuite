import type { ExtensionType } from '@labre/store';

import { TableBlockHtmlAdapterExtension } from './html.js';
import { TableBlockMarkdownAdapterExtension } from './markdown.js';
import { TableBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { TableBlockPlainTextAdapterExtension } from './plain-text.js';

export const TableBlockAdapterExtensions: ExtensionType[] = [
  TableBlockHtmlAdapterExtension,
  TableBlockMarkdownAdapterExtension,
  TableBlockNotionHtmlAdapterExtension,
  TableBlockPlainTextAdapterExtension,
];
