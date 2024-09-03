import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:database'),
  DatabaseBlockService,
  BlockViewExtension('affine:database', literal`affine-database`),
];
