import type { ExtensionType } from '@blocksuite/block-std';

import {
  DocNoteBlockHtmlAdapterExtension,
  EdgelessNoteBlockHtmlAdapterExtension,
} from './html.js';
import {
  DocNoteBlockMarkdownAdapterExtension,
  EdgelessNoteBlockMarkdownAdapterExtension,
} from './markdown.js';
import {
  DocNoteBlockPlainTextAdapterExtension,
  EdgelessNoteBlockPlainTextAdapterExtension,
} from './plain-text.js';

export const DocNoteBlockAdapterExtensions: ExtensionType[] = [
  DocNoteBlockMarkdownAdapterExtension,
  DocNoteBlockHtmlAdapterExtension,
  DocNoteBlockPlainTextAdapterExtension,
];

export const EdgelessNoteBlockAdapterExtensions: ExtensionType[] = [
  EdgelessNoteBlockMarkdownAdapterExtension,
  EdgelessNoteBlockHtmlAdapterExtension,
  EdgelessNoteBlockPlainTextAdapterExtension,
];
