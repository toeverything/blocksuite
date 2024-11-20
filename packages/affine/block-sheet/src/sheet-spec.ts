import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import {
  SheetKeymapExtension,
  SheetTextKeymapExtension,
} from './sheet-keymap.js';
import { SheetBlockService } from './sheet-service.js';

export const SheetBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:sheet'),
  SheetBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:sheet', literal`affine-sheet`),
  SheetKeymapExtension,
  SheetTextKeymapExtension,
];
