import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { ListKeymapExtension, ListTextKeymapExtension } from './list-keymap.js';
import { ListBlockService, ListDragHandleOption } from './list-service.js';

export const ListBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:list'),
  ListBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:list', literal`affine-list`),
  ListKeymapExtension,
  ListTextKeymapExtension,
  ListDragHandleOption,
];
