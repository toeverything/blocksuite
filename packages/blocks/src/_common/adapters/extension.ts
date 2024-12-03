import type { ExtensionType } from '@blocksuite/block-std';

import { AttachmentAdapterFactoryExtension } from './attachment.js';
import { ImageAdapterFactoryExtension } from './image.js';
import { BlockMarkdownAdapterExtensions } from './markdown/block-matcher.js';
import { MarkdownAdapterFactoryExtension } from './markdown/markdown.js';
import { BlockPlainTextAdapterExtensions } from './plain-text/block-matcher.js';
import { PlainTextAdapterFactoryExtension } from './plain-text/plain-text.js';

export const AdapterFactoryExtensions: ExtensionType[] = [
  AttachmentAdapterFactoryExtension,
  ImageAdapterFactoryExtension,
  MarkdownAdapterFactoryExtension,
  PlainTextAdapterFactoryExtension,
];

export const BlockAdapterMatcherExtensions: ExtensionType[] = [
  BlockPlainTextAdapterExtensions,
  BlockMarkdownAdapterExtensions,
].flat();
