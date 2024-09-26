import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { DatabaseSelectionExtension } from '@blocksuite/data-view';
import { literal } from 'lit/static-html.js';

import { DatabaseDragHandleOption } from './config.js';
import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:database'),
  DatabaseBlockService,
  BlockViewExtension('affine:database', literal`affine-database`),
  DatabaseDragHandleOption,
  DatabaseSelectionExtension,
];
