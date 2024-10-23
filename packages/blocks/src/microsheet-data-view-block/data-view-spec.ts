import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DataViewBlockService } from './database-service.js';

export const DataViewBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:data-view'),
  DataViewBlockService,
  BlockViewExtension('affine:data-view', literal`affine-data-view`),
];
