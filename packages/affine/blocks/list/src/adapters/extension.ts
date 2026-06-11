import type { ExtensionType } from '@labre/store';

import { ListBlockHtmlAdapterExtension } from './html.js';
import { ListBlockMarkdownAdapterExtension } from './markdown.js';
import { ListBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { ListBlockPlainTextAdapterExtension } from './plain-text.js';

export const ListBlockAdapterExtensions: ExtensionType[] = [
  ListBlockHtmlAdapterExtension,
  ListBlockMarkdownAdapterExtension,
  ListBlockPlainTextAdapterExtension,
  ListBlockNotionHtmlAdapterExtension,
];
