import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { DatabaseSelectionExtension } from '@blocksuite/data-view';
import { literal } from 'lit/static-html.js';

import { commands } from './commands.js';
import { DatabaseDragHandleOption } from './config.js';
import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:database'),
  DatabaseBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:database', literal`affine-database`),
  DatabaseDragHandleOption,
  DatabaseSelectionExtension,
];
