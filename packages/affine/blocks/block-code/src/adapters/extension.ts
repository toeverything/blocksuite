import type { ExtensionType } from '@blocksuite/store';

import { CodeBlockHtmlAdapterExtension } from './html.js';
import { CodeBlockMarkdownAdapterExtension } from './markdown.js';
import { CodeBlockNotionHtmlAdapterExtension } from './notion-html.js';
import { CodeBlockPlainTextAdapterExtension } from './plain-text.js';

export const CodeBlockAdapterExtensions: ExtensionType[] = [
  CodeBlockHtmlAdapterExtension,
  CodeBlockMarkdownAdapterExtension,
  CodeBlockPlainTextAdapterExtension,
  CodeBlockNotionHtmlAdapterExtension,
];
