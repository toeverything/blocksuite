import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { MicrosheetDataViewBlockService } from './microsheet-service.js';

export const MicrosheetDataViewBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:microsheet-data-view'),
  MicrosheetDataViewBlockService,
  BlockViewExtension(
    'affine:microsheet-data-view',
    literal`affine-microsheet-data-view`
  ),
];
