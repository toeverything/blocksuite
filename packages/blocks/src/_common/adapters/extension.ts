import type { ExtensionType } from '@blocksuite/block-std';

import { AttachmentAdapterFactoryExtension } from './attachment.js';
import { ImageAdapterFactoryExtension } from './image.js';
import { MarkdownAdapterFactoryExtension } from './markdown/markdown.js';

export const AdapterFactoryExtensions: ExtensionType[] = [
  AttachmentAdapterFactoryExtension,
  ImageAdapterFactoryExtension,
  MarkdownAdapterFactoryExtension,
];
