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
import {
  SheetBlockService,
  SheetCellService,
  SheetRowService,
} from './sheet-service.js';

export const SheetBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:sheet'),
  SheetBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:sheet', literal`affine-sheet`),
  SheetKeymapExtension,
  SheetTextKeymapExtension,
];

export const SheetRowSpec: ExtensionType[] = [
  FlavourExtension('affine:sheet-row'),
  SheetRowService,
  BlockViewExtension('affine:sheet-row', literal`affine-sheet-row`),
];

export const SheetCellSpec: ExtensionType[] = [
  FlavourExtension('affine:sheet-cell'),
  SheetCellService,
  BlockViewExtension('affine:sheet-cell', literal`affine-sheet-cell`),
];
