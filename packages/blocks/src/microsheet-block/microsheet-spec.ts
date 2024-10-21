import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { MicrosheetSelectionExtension } from '@blocksuite/data-view';
import { literal } from 'lit/static-html.js';

import { MicrosheetDragHandleOption } from './config.js';
import { MicrosheetBlockService } from './microsheet-service.js';

export const MicrosheetBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:microsheet'),
  MicrosheetBlockService,
  BlockViewExtension('affine:microsheet', literal`affine-microsheet`),
  MicrosheetDragHandleOption,
  MicrosheetSelectionExtension,
];
