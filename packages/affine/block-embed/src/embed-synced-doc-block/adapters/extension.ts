import type { ExtensionType } from '@blocksuite/block-std';

import { EmbedSyncedDocBlockHtmlAdapterExtension } from './html.js';
import { EmbedSyncedDocBlockMarkdownAdapterExtension } from './markdown.js';
import { EmbedSyncedDocBlockPlainTextAdapterExtension } from './plain-text.js';

export const EmbedSyncedDocBlockAdapterExtensions: ExtensionType[] = [
  EmbedSyncedDocBlockHtmlAdapterExtension,
  EmbedSyncedDocBlockMarkdownAdapterExtension,
  EmbedSyncedDocBlockPlainTextAdapterExtension,
];
