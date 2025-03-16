import { BlockViewExtension, FlavourExtension } from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { ParagraphBlockAdapterExtensions } from './adapters/extension.js';
import {
  ParagraphKeymapExtension,
  ParagraphTextKeymapExtension,
} from './paragraph-keymap.js';
import { ParagraphBlockService } from './paragraph-service.js';

export const ParagraphBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:paragraph'),
  ParagraphBlockService,
  BlockViewExtension('affine:paragraph', literal`affine-paragraph`),
  ParagraphTextKeymapExtension,
  ParagraphKeymapExtension,
  ParagraphBlockAdapterExtensions,
].flat();
