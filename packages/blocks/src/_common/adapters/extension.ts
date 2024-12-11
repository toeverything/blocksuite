import type { ExtensionType } from '@blocksuite/block-std';

import { AttachmentAdapterFactoryExtension } from './attachment.js';
import { BlockHtmlAdapterExtensions } from './html-adapter/block-matcher.js';
import { HtmlAdapterFactoryExtension } from './html-adapter/html.js';
import { ImageAdapterFactoryExtension } from './image.js';
import { BlockMarkdownAdapterExtensions } from './markdown/block-matcher.js';
import { MarkdownAdapterFactoryExtension } from './markdown/markdown.js';
import { NotionTextAdapterFactoryExtension } from './notion-text.js';
import { BlockPlainTextAdapterExtensions } from './plain-text/block-matcher.js';
import { PlainTextAdapterFactoryExtension } from './plain-text/plain-text.js';

export const AdapterFactoryExtensions: ExtensionType[] = [
  AttachmentAdapterFactoryExtension,
  ImageAdapterFactoryExtension,
  MarkdownAdapterFactoryExtension,
  PlainTextAdapterFactoryExtension,
  HtmlAdapterFactoryExtension,
  NotionTextAdapterFactoryExtension,
];

export const BlockAdapterMatcherExtensions: ExtensionType[] = [
  BlockPlainTextAdapterExtensions,
  BlockMarkdownAdapterExtensions,
  BlockHtmlAdapterExtensions,
].flat();
